import { EtchInscription, getSpacersVal } from "runelib";
import { delay, toXOnly, toXOnly2 } from "../utils/utils.service";
import * as Bitcoin from "bitcoinjs-lib";
import { type Taptree } from "bitcoinjs-lib/src/types";
import * as ecc from "tiny-secp256k1";
import { type Request, type Response } from "express";
import axios from "axios";

import {
  ADMIN_ADDRESS,
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  RUNE_RECEIVE_VALUE,
  TEST_MODE,
  WIF_KEY,
} from "../config/config";
import { LocalWallet } from "../utils/localWallet";
import { getFeeRate } from "../service/psbt.service";
import {
  broadcastPSBT,
  finalizePsbtInput0,
  inscribeRunePSBT,
  waitUntilUTXO,
} from "../utils/psbt.service";
import { sendBTC } from "../utils/unisat.service";
import { getBlockHeight, getTxStatus } from "../utils/mempool";
import RuneModel from "../model/RuneModal";
import { Status } from "../type";

Bitcoin.initEccLib(ecc);
const network = TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin;

const wallet = new LocalWallet(WIF_KEY, TEST_MODE ? 1 : 0);

const dummyUtxo = [
  {
    txid: "bbca2238117d6671f40f4efe5f2c6bb111dd60b589c6e72689fcab17798e7049",
    vout: 0,
    status: {
      confirmed: true,
      block_height: 2818544,
      block_hash:
        "0000000000000002975bc6dfde352d035e3fc6e5240219bf55bd12c892c5184b",
      block_time: 1716981277,
    },
    value: 27750,
  },
];

const etchingRuneToken = async (
  runeName: string,
  runeAmount: number,
  runeSymbol: string,
  initialPrice: string,
  creatorAddress: string
) => {
  try {
    // Verify Repeatance
    const repeatedName = await RuneModel.findOne({
      runeName,
    });
    if (repeatedName) return {
      success: false,
      message: "RuneName is already registered in DB",
      payload: null
    };

    const name = runeName.replaceAll(".", "•");
    const originalName = runeName.replaceAll(".", "").toLocaleUpperCase();
    const spacers = getSpacersVal(name);
    console.log(originalName);
    console.log(spacers);

    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/runes/${originalName}/info`;
    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    console.log("url ==> ", url);
    const networkRepeatance = (await axios.get(url, config)).data;
    console.log("networkRepeatance ==> ", networkRepeatance);
    if (networkRepeatance.data) return {
      success: false,
      message: "Already existed Rune Name",
      payload: null
    };

    const ins = new EtchInscription();
    const HTMLContent = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Build Your Own Recursive Ordinal</title>
      </head>
      <body style="margin: 0px">
        <div>
          ${runeName}
        </div>
      </body>
    </html>`;

    ins.setContent(
      "text/html;charset=utf-8",
      Buffer.from(HTMLContent, "utf-8")
    );
    ins.setRune(originalName);

    const etching_script_asm = `${toXOnly2(
      Buffer.from(wallet.pubkey, "hex")
    ).toString("hex")} OP_CHECKSIG`;

    const etching_script = Buffer.concat([
      new Uint8Array(Bitcoin.script.fromASM(etching_script_asm)),
      new Uint8Array(ins.encipher()),
    ]);

    const scriptTree: Taptree = {
      output: etching_script,
    };

    const script_p2tr = Bitcoin.payments.p2tr({
      internalPubkey: toXOnly2(Buffer.from(wallet.pubkey, "hex")),
      scriptTree,
      network,
    });

    const etching_redeem = {
      output: etching_script,
      redeemVersion: 192,
    };

    const etching_p2tr = Bitcoin.payments.p2tr({
      internalPubkey: toXOnly2(Buffer.from(wallet.pubkey, "hex")),
      scriptTree,
      redeem: etching_redeem,
      network,
    });

    const address = script_p2tr.address ?? "";
    if (address === "") {
      console.log("Can Not Get Inscription Address");
      return {
        success: false,
        message: "Can Not Get Inscription Address",
        payload: null
      };
    }

    const feeRate = await getFeeRate();
    const generateDummyInscribePSBT = await inscribeRunePSBT(
      dummyUtxo,
      script_p2tr,
      etching_p2tr,
      etching_redeem,
      //   wallet.address,
      ADMIN_ADDRESS,
      runeSymbol,
      runeAmount,
      originalName,
      spacers
    );
    const dummyDataVB = await finalizePsbtInput0(
      generateDummyInscribePSBT.toHex()
    );
    const calcTxFee = dummyDataVB.virtualSize() * feeRate;

    const sendBTCTxId = await sendBTC(calcTxFee + RUNE_RECEIVE_VALUE, address);

    await delay(5000);

    const utxos = await waitUntilUTXO(address);
    const utxo = utxos.filter(
      (utxo) => utxo.value === calcTxFee + RUNE_RECEIVE_VALUE
    );

    const generateInscribePSBT = await inscribeRunePSBT(
      utxo,
      script_p2tr,
      etching_p2tr,
      etching_redeem,
      ADMIN_ADDRESS,
      runeSymbol,
      runeAmount,
      originalName,
      spacers
    );

    const payload = {
      txId: "",
      sendBTCTxId: sendBTCTxId,
      runeName: runeName,
      runeSymbol: runeSymbol,
      initialPrice: initialPrice,
      creatorAddress: creatorAddress,
      runeid: "",
      runeAmount: runeAmount,
      remainAmount: runeAmount,
      psbt: generateInscribePSBT.toHex(),
      status: Status.Pending,
    };

    // Save
    const newRune = new RuneModel(payload);
    await newRune.save();

    return {
      success: true,
      message: "Rune etching successfully",
      payload
    };;
  } catch (error) {
    console.log("Error occurs while etching rune token => ", error);
    throw error;
  }
};

export const createRuneToken = async (
  runeName: string,
  runeAmount: number,
  runeSymbol: string,
  initialPrice: string,
  creatorAddress: string
) => {
  try {
    const payload = await etchingRuneToken(
      runeName,
      runeAmount,
      runeSymbol,
      initialPrice,
      creatorAddress
    );

    return payload;
  } catch (error) {
    console.log("While Create Rune Token => ", error);
    return {
      success: false,
      message: error,
      payload: null
    };
  }
};

export const checkTxStatus = async () => {
  try {
    console.log("checkTxStatus ==> ");
    const runeIdList = [];
    let _cnt = 0;
    const currentBlockHeight = await getBlockHeight();
    console.log("currentBlockHeight ==> ", currentBlockHeight);

    const ruenEtchingList = await RuneModel.find({
      status: Status.Pending,
    });
    // console.log("ruenEtchingList ==> ", ruenEtchingList);

    const checkRuneEtchingList = await Promise.all(
      ruenEtchingList.map((etchinglist) => getTxStatus(etchinglist.sendBTCTxId))
    );
    // console.log("checkRuneEtchingList ==> ", checkRuneEtchingList);

    for (const checkRuneEtching of checkRuneEtchingList) {
      console.log("checkRuneEtching ==> ", checkRuneEtching);
      console.log("checkRuneEtching.block_Height ==> ", checkRuneEtching.block_height);
      console.log("currentBlockHeight >= checkRuneEtching.blockHeight + 6 ==> ", currentBlockHeight >= checkRuneEtching.block_height + 6);
      if (
        checkRuneEtching.confirmed &&
        currentBlockHeight >= checkRuneEtching.block_height + 6
      ) {
        console.log("<== 6 block later ==>")
        const txId = await broadcastPSBT(ruenEtchingList[_cnt].psbt);
        const updateItem = ruenEtchingList[_cnt];
        updateItem.status = Status.Ready;
        updateItem.txId = txId;
        await updateItem.save();
        console.log("txId ==> ", txId);
      }
      _cnt++;
    }

    console.log("Status Pending Ended ==> ");

    _cnt = 0;

    const ruenEtchingList1 = await RuneModel.find({
      status: Status.Ready,
    });

    // console.log("ruenEtchingList1 ==> ", ruenEtchingList1);

    const checkRuneEtchingList1 = await Promise.all(
      ruenEtchingList1.map((etchinglist) =>
        getTxStatus(etchinglist.txId ? etchinglist.txId : "")
      )
    );

    // console.log("checkRuneEtchingList1 ==> ", checkRuneEtchingList1);

    for (const checkRuneEtching1 of checkRuneEtchingList1) {
      if (checkRuneEtching1.confirmed) {
        const url = `${OPENAPI_UNISAT_URL}/v1/indexer/runes/utxo/${ruenEtchingList1[_cnt].txId}/1/balance`;
        console.log("url ==> ", url);
        const config = {
          headers: {
            Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
          },
        };
        const res = await axios.get(url, config);
        console.log("res.data.data[0] ==> ", res.data);
        const updateItem = ruenEtchingList1[_cnt];
        updateItem.status = Status.End;
        updateItem.runeid = res.data.data[0].runeid;
        runeIdList.push(res.data.data[0].runeid);
        await updateItem.save();
      }
      _cnt++;
    }

    console.log("Status End Ended ==> ");
    console.log("runeIdList ==> ", runeIdList);

    return {
      success: true,
      message: "checked transaction successfully.",
      payload: runeIdList
    };
  } catch (error) {
    console.log("Check All Etching Tx Status : ", error);
    return {
      success: false,
      message: "Get failure while checking transaction.",
      payload: null
    };
  }
};
