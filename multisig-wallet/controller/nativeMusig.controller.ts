import { Taptree } from "bitcoinjs-lib/src/types";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { Network, payments, Psbt, Transaction } from "bitcoinjs-lib";

import {
  calculateTxFee,
  combinePsbt,
  getAllRuneIdList,
  getBtcUtxoByAddress,
  getFeeRate,
  getRuneUtxoByAddress,
  pushRawTx,
  transferAllAssetsFeeCalc,
} from "../service/psbt.service";
import {
  checkingAssets,
  getFeeLevel,
  getInscriptionData,
  getTxHexById,
  getUTXOByAddress,
  usdToSats,
} from "../utils/function";
import {
  IAssets,
  ITapBalance,
  ITapItemList,
  IVault,
  RequestType,
  VaultType,
} from "../type";
import MultisigModal from "../model/Multisig";
import RequestModal from "../model/RequestModal";
import { none, RuneId, Runestone } from "runelib";
import TempMultisigModal from "../model/TempMultisig";
import {
  FEE_ADDRESS,
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  ORDINAL_URL,
  SERVICE_FEE,
  SERVICE_FEE_ADDRESS,
  SERVICE_FEE_VIP,
  TEST_MODE,
  TRAC_NETWORK_API,
  WalletTypes,
} from "../config/config";
import axios, { AxiosResponse } from "axios";
import { networks } from "ecpair";
import TaprootMultisigModal from "../model/TaprootMultisig";
import { WIFWallet } from "../utils/WIFWallet";
import { Signer as BTCSigner } from "bitcoinjs-lib";
import { delay } from "../utils/utils.service";
import PendingMultisigModal from "../model/PendingMultisig";
import { IAddress } from "../utils/types";
import { createTaprootMultisig } from "./taproot.controller";

const bitcoin = require("bitcoinjs-lib");
const schnorr = require("bip-schnorr");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");

const ECPair = ECPairFactory(ecc);
const network = TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin; // Otherwise, bitcoin = mainnet and regnet = local
const blockstream = new axios.Axios({
  baseURL: TEST_MODE
    ? `https://mempool.space/testnet/api`
    : `https://mempool.space/api`,
});

export async function createNativeSegwit(
  vaultName: string,
  originPubkeys: string[],
  threshold: number,
  assets: IAssets,
  network: Network,
  imageUrl: string
) {
  try {
    const existMusigWallet = await MultisigModal.findOne({
      cosigner: originPubkeys,
    });

    if (existMusigWallet)
      return {
        success: false,
        message: "These public key pair is already existed.",
        payload: null,
      };

    const hexedPubkeys = originPubkeys.map((pubkey) =>
      Buffer.from(pubkey, "hex")
    );
    console.log("hexedPubkeys ==> ", hexedPubkeys);
    const p2ms = bitcoin.payments.p2ms({
      m: parseInt(threshold.toString()),
      pubkeys: hexedPubkeys,
      network,
    });
    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });

    const newMultisigWallet = new MultisigModal({
      vaultName,
      cosigner: originPubkeys,
      witnessScript: p2wsh.redeem.output.toString("hex"),
      p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
      address: p2wsh.address,
      threshold,
      assets,
      imageUrl,
    });

    await newMultisigWallet.save();
    console.log(
      "created newMultisigWallet ==> ",
      newMultisigWallet._id.toString()
    );

    return {
      success: true,
      message: "Create Musig Wallet successfully.",
      payload: {
        DBID: newMultisigWallet._id.toString(),
        address: p2wsh.address,
      },
    };
  } catch (error: any) {
    console.log("error in creating segwit address ==> ", error);
    return {
      success: false,
      message: "There is something error",
      payload: null,
    };
  }
}

export async function loadAllMusigWallets() {
  try {
    const allMuwallets = await MultisigModal.find();
    let message = "";
    if (!allMuwallets.length) message = "There is no multisig wallet.";
    else message = "Fetch all multisig wallet successfully";

    return {
      success: true,
      message,
      payload: allMuwallets,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error,
      payload: null,
    };
  }
}

export async function loadOneMusigWallets(id: string) {
  try {
    const oneMuwallets = await MultisigModal.findById(id);
    if (oneMuwallets)
      return {
        success: true,
        message: "Native Segwit Vault is fetched successfully.",
        payload: oneMuwallets,
      };

    const oneTaprootVault = await TaprootMultisigModal.findById(id);
    if (oneTaprootVault)
      return {
        success: true,
        message: "Taproot Vault is fetched successfully.",
        payload: oneTaprootVault,
      };

    return {
      success: false,
      message: "Not Found.",
      payload: null,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error,
      payload: null,
    };
  }
}

export async function makeRequest(
  id: string,
  transferAmount: number,
  destinationAddress: string,
  ordinalAddress: string,
  pubKey: string
) {
  const MusigWallet = await MultisigModal.findById(id);
  if (!MusigWallet)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    MusigWallet;

  const pubkeyAllowed = cosigner.findIndex((key: string) => key == pubKey);
  if (pubkeyAllowed < 0)
    return {
      success: false,
      message: "Not allowed pubkey.",
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
    };

  if (!assets.runeName && !assets.runeAmount)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
    };

  const assetsAllowed = await checkingAssets(
    ordinalAddress,
    assets.runeName,
    parseInt(assets.runeAmount)
  );
  if (!assetsAllowed)
    return {
      success: false,
      message: "Not have enough assets in this address",
    };

  const psbt = new bitcoin.Psbt({ network });
  const usedUtxoIds = [];
  let total = 0;
  const utxos = await getUTXOByAddress(address);
  if (utxos.length == 0) {
    return "There is no UTXO in this address";
  }

  for (const utxo of utxos) {
    if (total < transferAmount + 25000 && utxo.value > 1000) {
      usedUtxoIds.push(utxo.txid);
      total += utxo.value;
      const utxoHex = await getTxHexById(utxo.txid);
      console.log("selected utxoHex ==> ", utxoHex);
      console.log("addInput ==> ", {
        hash: utxo.txid,
        index: utxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: utxo.value,
        },
      });
      await psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: utxo.value,
        },
      });
    }
  }

  psbt.addOutput({
    address: destinationAddress,
    value: transferAmount,
  });
  // const feeRate = await getFeeRate();
  const feeRate = 300;
  const fee = calculateTxFee(psbt, feeRate);

  console.log("feeRate ==> ", feeRate);
  console.log("fee ==> ", fee);
  psbt.addOutput({
    address: address,
    value: total - fee - transferAmount,
  });

  const newRequest = new RequestModal({
    musigId: MusigWallet._id,
    type: RequestType.Tranfer,
    transferAmount,
    destinationAddress,
    creator: ordinalAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return psbt.toHex();
}

export async function reCreateNativeSegwit(
  originPubkeys: string[],
  threshold: number,
  assets: IAssets,
  network: Network,
  vaultId: any,
  imageUrl: string
) {
  try {
    console.log("reCreateNativeSegwit ==> ");
    const existMusigWallet = await MultisigModal.findOne({
      cosigner: originPubkeys,
    });

    console.log("existMusigWallet ==> ", existMusigWallet);
    console.log("existMusigWallet ==> ", existMusigWallet?._id);
    console.log("vaultId ==> ", vaultId);

    if (existMusigWallet && existMusigWallet._id != vaultId) {
      console.log("These public key pair is already existed in other wallets.");
      return {
        success: false,
        message: "These public key pair is already existed in other wallets.",
        payload: null,
      };
    }

    console.log("vaultId ==> ", vaultId);

    const hexedPubkeys = originPubkeys.map((pubkey) =>
      Buffer.from(pubkey, "hex")
    );
    const p2ms = bitcoin.payments.p2ms({
      m: parseInt(threshold.toString()),
      pubkeys: hexedPubkeys,
      network,
    });

    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
    console.log("p2wsh ==> ", p2wsh);

    const newMultisigWallet = new TempMultisigModal({
      cosigner: originPubkeys,
      witnessScript: p2wsh.redeem.output.toString("hex"),
      p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
      address: p2wsh.address,
      threshold,
      assets,
      imageUrl,
    });

    await newMultisigWallet.save();

    return {
      success: true,
      message: "Create Musig Wallet temporary.",
      payload: newMultisigWallet,
    };

    // Make the request
  } catch (error: any) {
    console.log("When create the Musig wallet ==> ", error);
    return {
      success: false,
      message: "There is something error",
      payload: null,
    };
  }
}

export async function transferAllAssets(
  oldVault: IVault,
  newVault: IVault,
  ordinalAddress: string
) {
  console.log("transferAllAssets ==> ");
  const oldAddress = oldVault.address;
  const destinationAddress = newVault.address;
  const thresHoldValue = oldVault.threshold;

  const { witnessScript, p2msOutput } = oldVault;

  console.log(oldAddress, destinationAddress);

  const btcUtxos = await getBtcUtxoByAddress(oldAddress);
  const runeIdList = await getAllRuneIdList(oldAddress);

  if (!btcUtxos.length && !runeIdList.length) {
    TempMultisigModal.findByIdAndDelete(newVault._id);
    throw "There is no any BTC in vault for updating.";
  }

  const psbt = new Psbt({ network });

  // Rune utxo input
  for (const runeId of runeIdList) {
    const runeUtxos = await getRuneUtxoByAddress(oldAddress, runeId);
    console.log("runeUtxos ======>", runeUtxos.runeUtxos);

    // create rune utxo input && edict
    for (const runeutxo of runeUtxos.runeUtxos) {
      psbt.addInput({
        hash: runeutxo.txid,
        index: runeutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: runeutxo.value,
        },
      });
      psbt.addOutput({
        address: destinationAddress, // rune receiver address
        value: runeutxo.value,
      });
    }
  }

  // add btc utxo input
  let totalBtcAmount = 0;
  for (const btcutxo of btcUtxos) {
    if (btcutxo.value > 546) {
      totalBtcAmount += btcutxo.value;

      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  const feeRate = Math.floor(await getFeeRate());
  console.log("feeRate ==> ", feeRate);
  // console.log("psbt ==> ", psbt);

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  psbt.addOutput({
    address: SERVICE_FEE_ADDRESS,
    value: serverFeeSats,
  });

  const fee = transferAllAssetsFeeCalc(psbt, feeRate, thresHoldValue);

  console.log("Pay Fee ==>", fee);

  if (totalBtcAmount < fee) {
    TempMultisigModal.findByIdAndDelete(newVault._id);
    throw "BTC balance is not enough for pay fee";
  }

  console.log("totalBtcAmount ====>", totalBtcAmount);

  psbt.addOutput({
    address: destinationAddress,
    value: totalBtcAmount - serverFeeSats - fee,
  });

  console.log("psbt ==> ");
  console.log(psbt);

  console.log("psbt ============>", psbt.toHex());

  // Make the request
  const newRequest = new RequestModal({
    musigId: oldVault._id,
    type: RequestType.VaultUpgrade,
    transferAmount: "ALL",
    destinationAddress,
    creator: ordinalAddress,
    signedCosigner: [],
    cosigner: oldVault.cosigner,
    psbt: [psbt.toHex()],
    threshold: oldVault.threshold,
    assets: {
      initialPrice: oldVault.assets?.initialPrice,
      runeName: oldVault.assets?.runeName,
      runeAmount: oldVault.assets?.runeAmount,
      runeSymbol: oldVault.assets?.runeSymbol,
      creatorAddress: oldVault.assets?.creatorAddress,
    },
    pending: "",
  });

  await newRequest.save();

  return {
    psbtHex: psbt.toHex(),
    psbtBase64: psbt.toBase64(),
  };
}

export async function getBtcAndRuneByAddressController(address: string) {
  const btcUrl = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/balance`;
  console.log("url ==> ", btcUrl);

  const config = {
    headers: {
      Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
    },
  };
  const btcBalance = (await axios.get(btcUrl, config)).data.data.btcSatoshi;
  console.log("btcBalance ==> ", btcBalance);

  const runeUrl = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/balance-list?start=0&limit=500`;
  console.log("url ==> ", runeUrl);
  const runeBalance = (await axios.get(runeUrl, config)).data.data.detail;
  console.log("runeBalance ==> ", runeBalance);
  const inscriptionUrl = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/inscription-data`;
  console.log("inscriptionUrl ==> ", inscriptionUrl);
  const inscriptionList = (await axios.get(inscriptionUrl, config)).data.data
    .inscription;
  const ordinalsList = [];
  const brc20List = [];

  const brc20Url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/brc20/summary`;
  console.log("brc20Url ==> ", brc20Url);
  const brc20Balance = (await axios.get(brc20Url, config)).data.data.detail;
  // inscriptionList.map((inscription: any) => {
  for (const inscription of inscriptionList) {
    const temp = inscription.utxo.inscriptions[0];
    const content = (await axios.get(`${ORDINAL_URL}/${temp.inscriptionId}`))
      .data;
    if (!temp.isBRC20 && content.p != "tap") {
      ordinalsList.push({
        inscriptionNumber: temp.inscriptionNumber,
        inscriptionId: temp.inscriptionId,
      });
    }
  }

  for (const brc20 of brc20Balance) {
    brc20List.push({
      ticker: brc20.ticker,
      amount: brc20.overallBalance,
    });
  }

  console.log("ordinalsList ==> ", ordinalsList);
  console.log("brc20List ==> ", brc20List);

  return {
    btcBalance,
    runeBalance,
    ordinalsList,
    brc20List,
  };
}

export async function sendBtcController(
  walletId: string,
  destination: string,
  amount: number,
  paymentAddress: string,
  ordinalAddress: string
) {
  console.log("walletId ==> ", walletId);
  console.log("destination ==> ", destination);
  console.log("amount ==> ", amount);

  const multisigVault = await MultisigModal.findById(walletId);
  if (!multisigVault)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
      payload: null,
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    multisigVault;
  const psbt = new Psbt({
    network: TEST_MODE ? networks.testnet : networks.bitcoin,
  });

  if (!multisigVault)
    return {
      success: false,
      message: "There is no wallet with this id.",
      payload: null,
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
      payload: null,
    };
  const btcUtxos = await getBtcUtxoByAddress(multisigVault.address);
  console.log("btcUtxos ==> ", btcUtxos);

  const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);

  let totalBtcAmount = 0;
  let fee = 0;

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  for (const btcutxo of btcUtxos) {
    fee = calculateTxFee(psbt, feeRate);
    if (
      totalBtcAmount < fee + amount * 1 + serverFeeSats &&
      btcutxo.value > 1000
    ) {
      totalBtcAmount += btcutxo.value;
      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  console.log("totalBtcAmount ==> ", totalBtcAmount);
  console.log("fee ==> ", fee);
  console.log("amount ==> ", amount);
  console.log("fee + amount*1 ==> ", fee + amount * 1);

  let outputCount = 0;

  psbt.addOutput({
    address: destination,
    value: amount * 1,
  });
  outputCount++;

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });
  outputCount++;

  fee = calculateTxFee(psbt, feeRate);

  if (totalBtcAmount < fee + amount * 1)
    return {
      success: false,
      message: "BTC balance is not enough",
      payload: null,
    };

  psbt.addOutput({
    address: multisigVault.address,
    value: totalBtcAmount - serverFeeSats - amount - fee,
  });

  console.log("paymentAddress ==> ", paymentAddress);

  const newRequest = new RequestModal({
    musigId: walletId,
    type: RequestType.Tranfer,
    transferAmount: amount,
    destinationAddress: destination,
    creator: paymentAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return {
    success: true,
    message: "Generating PSBT successfully.",
    payload: psbt.toHex(),
  };
}

export async function sendRuneController(
  walletId: string,
  destination: string,
  runeId: string,
  amount: number,
  ordinalAddress: string,
  pubKey: string
) {
  console.log("walletId ==> ", walletId);
  console.log("destination ==> ", destination);
  console.log("amount ==> ", amount);
  console.log("runeId ==> ", runeId);
  console.log("ordinalAddress ==> ", ordinalAddress);

  const multisigVault = await MultisigModal.findById(walletId);
  if (!multisigVault)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
      payload: null,
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    multisigVault;

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  const psbt = new Psbt({
    network: TEST_MODE ? networks.testnet : networks.bitcoin,
  });

  if (!multisigVault)
    return {
      success: false,
      message: "There is no wallet with this id.",
      payload: null,
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
      payload: null,
    };

  const btcUtxos = await getBtcUtxoByAddress(address);
  const runeUtxos = await getRuneUtxoByAddress(address, runeId);
  const FinalEdicts: any = [];
  let FinaltokenSum = 0;
  const runeBlockNumber = parseInt(runeId.split(":")[0]);
  const runeTxout = parseInt(runeId.split(":")[1]);

  for (const runeutxo of runeUtxos.runeUtxos) {
    psbt.addInput({
      hash: runeutxo.txid,
      index: runeutxo.vout,
      witnessScript: Buffer.from(witnessScript, "hex"),
      witnessUtxo: {
        value: runeutxo.value,
        script: Buffer.from(p2msOutput, "hex"),
      },
    });
    FinaltokenSum += runeutxo.amount * 10 ** runeutxo.divisibility;
  }

  if (FinaltokenSum - amount * 10 ** runeUtxos.runeUtxos[0].divisibility > 0) {
    FinalEdicts.push({
      id: new RuneId(runeBlockNumber, runeTxout),
      amount: amount * 10 ** runeUtxos.runeUtxos[0].divisibility,
      output: 2,
    });

    FinalEdicts.push({
      id: new RuneId(runeBlockNumber, runeTxout),
      amount:
        FinaltokenSum - amount * 10 ** runeUtxos.runeUtxos[0].divisibility,
      output: 1,
    });
  } else {
    FinalEdicts.push({
      id: new RuneId(runeBlockNumber, runeTxout),
      amount: parseInt(amount.toString()),
      output: 1,
    });
  }

  console.log("FinaltokenSum ==> ", FinaltokenSum);
  console.log("transferAmount ==> ", FinalEdicts);

  const Finalmintstone = new Runestone(FinalEdicts, none(), none(), none());

  psbt.addOutput({
    script: Finalmintstone.encipher(),
    value: 0,
  });

  if (FinaltokenSum - amount > 0) {
    psbt.addOutput({
      address: address, // rune sender address
      value: 546,
    });
  }

  // add rune receiver address
  psbt.addOutput({
    address: destination, // rune receiver address
    value: 546,
  });

  const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);
  let FinalTotalBtcAmount = 0;
  let finalFee = 0;
  for (const btcutxo of btcUtxos) {
    finalFee = await calculateTxFee(psbt, feeRate);
    if (
      FinalTotalBtcAmount < finalFee + serverFeeSats &&
      btcutxo.value > 1000
    ) {
      FinalTotalBtcAmount += btcutxo.value;
      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  console.log("Pay finalFee =====================>", finalFee);

  if (FinalTotalBtcAmount < finalFee)
    return {
      success: false,
      message: "BTC balance is not enough",
      payload: null,
    };

  console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: address,
    value: FinalTotalBtcAmount - finalFee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: walletId,
    type: RequestType.Tranfer,
    transferAmount: amount,
    destinationAddress: destination,
    creator: ordinalAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return {
    success: true,
    message: "Generating PSBT successfully",
    payload: psbt.toHex(),
  };
}

export async function sendOrdinalsController(
  walletId: string,
  destination: string,
  inscriptionId: string,
  paymentAddress: string,
  ordinalAddress: string
) {
  console.log("walletId ==> ", walletId);
  console.log("destination ==> ", destination);
  console.log("inscriptionId ==> ", inscriptionId);
  console.log("paymentAddress ==> ", paymentAddress);

  const multisigVault = await MultisigModal.findById(walletId);
  if (!multisigVault)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    multisigVault;
  const psbt = new Psbt({
    network: TEST_MODE ? networks.testnet : networks.bitcoin,
  });

  if (!multisigVault)
    return {
      success: false,
      message: "There is no wallet with this id.",
      payload: null,
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
    };

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  const inscriptionData = await getInscriptionData(
    multisigVault.address,
    inscriptionId
    // "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
  );

  psbt.addInput({
    hash: inscriptionData.txid,
    index: inscriptionData.vout,
    witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
    witnessUtxo: {
      script: Buffer.from(multisigVault.p2msOutput, "hex"),
      value: inscriptionData.satoshi,
    },
  });

  psbt.addOutput({
    address: destination,
    value: inscriptionData.satoshi,
  });

  const btcUtxos = await getBtcUtxoByAddress(address);

  const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);
  let FinalTotalBtcAmount = 0;
  let finalFee = 0;
  for (const btcutxo of btcUtxos) {
    finalFee = await calculateTxFee(psbt, feeRate);
    if (
      FinalTotalBtcAmount < finalFee + serverFeeSats &&
      btcutxo.value > 1000
    ) {
      FinalTotalBtcAmount += btcutxo.value;
      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  console.log("Pay finalFee =====================>", finalFee);

  if (FinalTotalBtcAmount < finalFee)
    throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;

  console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: address,
    value: FinalTotalBtcAmount - finalFee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: walletId,
    type: RequestType.Tranfer,
    transferAmount: 1,
    destinationAddress: destination,
    creator: paymentAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return psbt.toHex();
}

export async function sendbrc20Controller(
  vaultId: string,
  inscriptionId: string,
  destination: string,
  ticker: string,
  amount: number,
  paymentAddress: string,
  ordinalAddress: string
) {
  console.log("walletId ==> ", vaultId);
  console.log("destination ==> ", destination);
  console.log("inscriptionId ==> ", inscriptionId);
  console.log("paymentAddress ==> ", paymentAddress);
  console.log("ticker ==> ", inscriptionId);
  console.log("amount ==> ", paymentAddress);

  const multisigVault = await MultisigModal.findById(vaultId);
  if (!multisigVault)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    multisigVault;
  const psbt = new Psbt({
    network: TEST_MODE ? networks.testnet : networks.bitcoin,
  });

  if (!multisigVault)
    return {
      success: false,
      message: "There is no wallet with this id.",
      payload: null,
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
    };

  const inscriptionData = await getInscriptionData(
    multisigVault.address,
    inscriptionId
  );

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  psbt.addInput({
    hash: inscriptionData.txid,
    index: inscriptionData.vout,
    witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
    witnessUtxo: {
      script: Buffer.from(multisigVault.p2msOutput, "hex"),
      value: inscriptionData.satoshi,
    },
  });

  psbt.addOutput({
    address: destination,
    value: inscriptionData.satoshi,
  });

  const btcUtxos = await getBtcUtxoByAddress(address);

  const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);
  let FinalTotalBtcAmount = 0;
  let finalFee = 0;
  for (const btcutxo of btcUtxos) {
    finalFee = await calculateTxFee(psbt, feeRate);
    if (
      FinalTotalBtcAmount < finalFee + serverFeeSats &&
      btcutxo.value > 1000
    ) {
      FinalTotalBtcAmount += btcutxo.value;
      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  console.log("Pay finalFee =====================>", finalFee);

  if (FinalTotalBtcAmount < finalFee)
    throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;

  console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: address,
    value: FinalTotalBtcAmount - finalFee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: vaultId,
    type: `${RequestType.Brc20}-${ticker.toUpperCase()}`,
    transferAmount: amount,
    destinationAddress: destination,
    creator: paymentAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return psbt.toHex();
}

export function createparentInscriptionTapScript(
  pubkey: Buffer,
  itemList: ITapItemList[]
): Array<Buffer> {
  const temp = {
    p: "tap",
    op: "token-send",
    items: itemList,
  };

  const tokenSend = JSON.stringify(temp);
  // const tokenSend = `{
  //   "p" : "tap",
  //   "op" : "token-send",
  //   "items" : [
  //     {
  //       "tick": "TAPIS",
  //       "amt": "200",
  //       "address" : "tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"
  //     },
  //     {
  //       "tick": "TAPIS",
  //       "amt": "150",
  //       "address" : "tb1p5pr8d9zn608mnau0rqlsum9xrdgnaqesmy7evn84g6vukhsxal6qu7p92l"
  //     }
  //   ]
  // }`;
  // const tokenSend = '{"p":"tap","op":"token-send","items":[{"tick":"TAPIS","amt":200,"address":"tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"},{"tick":"TAPIS","amt":150,"address":"tb1p5pr8d9zn608mnau0rqlsum9xrdgnaqesmy7evn84g6vukhsxal6qu7p92l"}]}'

  // console.log(tokenSend)
  console.log(
    JSON.stringify({
      p: "tap",
      op: "token-send",
      items: itemList,
    })
  );

  const parentOrdinalStacks: any = [
    toXOnly(pubkey),
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_FALSE,
    bitcoin.opcodes.OP_IF,
    Buffer.from("ord", "utf8"),
    1,
    1,
    // @ts-ignore
    Buffer.concat([Buffer.from("text/plain;charset=utf-8", "utf8")]),
    bitcoin.opcodes.OP_0,
    // @ts-ignore
    // Buffer.concat([Buffer.from(JSON.stringify(tokenSend), "utf8")]),
    Buffer.concat([Buffer.from(tokenSend, "utf8")]),
    bitcoin.opcodes.OP_ENDIF,
  ];
  return parentOrdinalStacks;
}

export async function waitUntilUTXO(address: string) {
  return new Promise<IUTXO[]>((resolve, reject) => {
    let intervalId: any;
    const checkForUtxo = async () => {
      try {
        const response: AxiosResponse<string> = await blockstream.get(
          `/address/${address}/utxo`
        );
        const data: IUTXO[] = response.data
          ? JSON.parse(response.data)
          : undefined;
        console.log(data);
        if (data.length > 0) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(checkForUtxo, 4000);
  });
}

export const inscribeText = async (
  paymentAddress: string,
  paymentPublicKey: string,
  itemList: ITapItemList[],
  walletType: string
) => {
  try {
    const keyPair = ECPair.makeRandom({ network: network });
    const privateKey = keyPair.toWIF();
    const parentOrdinalStack = createparentInscriptionTapScript(
      keyPair.publicKey,
      itemList
    );

    const ordinal_script = bitcoin.script.compile(parentOrdinalStack);

    const scriptTree: Taptree = {
      output: ordinal_script,
    };

    const redeem = {
      output: ordinal_script,
      redeemVersion: 192,
    };

    const ordinal_p2tr = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(keyPair.publicKey),
      network,
      scriptTree,
      redeem,
    });

    const address = ordinal_p2tr.address ?? "";
    console.log("send coin to address", address);

    let paymentoutput;

    console.log("walletType ==> ", walletType);
    if (walletType === WalletTypes.XVERSE) {
      const hexedPaymentPubkey = Buffer.from(paymentPublicKey, "hex");
      const p2wpkh = payments.p2wpkh({
        pubkey: hexedPaymentPubkey,
        network: network,
      });

      const { address, redeem } = payments.p2sh({
        redeem: p2wpkh,
        network: network,
      });

      paymentoutput = redeem?.output;
    }

    const btcUtxos = await getBtcUtxoByAddress(paymentAddress);
    console.log("btcUtxos ==> ", btcUtxos);
    console.log("paymentAddress ==> ", paymentAddress);

    const psbt = new Psbt({ network });
    const feeRate = await getFeeRate();
    console.log("feeRate ==> ", feeRate);
    let fee;
    let totalBtcAmount = 0;
    const sendAmount = await generateDummyInscribe(feeRate, itemList);

    console.log("sendAmount => ", sendAmount);

    for (const btcutxo of btcUtxos) {
      fee = calculateTxFee(psbt, feeRate);
      if (totalBtcAmount < fee + sendAmount && btcutxo.value > 1000) {
        totalBtcAmount += btcutxo.value;
        if (
          walletType === WalletTypes.UNISAT ||
          walletType === WalletTypes.OKX
        ) {
          psbt.addInput({
            hash: btcutxo.txid,
            index: btcutxo.vout,
            witnessUtxo: {
              value: btcutxo.value,
              script: Buffer.from(btcutxo.scriptpubkey as string, "hex"),
            },
            tapInternalKey: Buffer.from(paymentPublicKey, "hex").slice(1, 33),
          });
        } else if (walletType === WalletTypes.XVERSE) {
          const txHex = await getTxHexById(btcutxo.txid);

          psbt.addInput({
            hash: btcutxo.txid,
            index: btcutxo.vout,
            redeemScript: paymentoutput,
            nonWitnessUtxo: Buffer.from(txHex, "hex"),
          });
        }
      }
    }

    fee = calculateTxFee(psbt, feeRate);

    console.log("totalBtcAmount ==> ", totalBtcAmount);
    console.log("fee + sendAmount ==> ", fee + sendAmount);

    if (totalBtcAmount < fee + sendAmount)
      throw `You Have not got enough money. Need ${totalBtcAmount} sats but you have only ${
        fee + sendAmount
      } sats. `;

    psbt.addOutput({
      address: address,
      value: sendAmount,
    });

    psbt.addOutput({
      address: paymentAddress,
      value: totalBtcAmount - fee - sendAmount,
    });

    return {
      success: true,
      message: "Success",
      payload: {
        amount: sendAmount,
        privateKey: privateKey,
        psbt: psbt.toHex(),
      },
    };
  } catch (error) {
    console.log("Inscribe Text Error ", error);
    return {
      success: false,
      message: "Get failed while inscribing text",
      payload: error,
    };
  }
};

export const generateDummyInscribe = async (
  feeRate: number,
  itemList: ITapItemList[]
) => {
  const privateKey = TEST_MODE
    ? "cNfPNUCLMdcSM4aJhuEiKEK44YoziFVD3EYh9tVgc4rjSTeaYwHP"
    : "Kzv5ZwHhXoNpkB5tgqLrE5sTPELE5kA8Q1DmKQBvvJstbxiZUewn";
  const receiveAddress = TEST_MODE
    ? "tb1p2vsa0qxsn96sulauasfgyyccfjdwp2rzg8h2ejpxcdauulltczuqw02jmj"
    : "bc1p82293vmfxnyd0tplme0gjzgrpte2ter30slgfk8c65wxl5vjv7dsphn0lq";
  const utxos = TEST_MODE
    ? {
        txid: "6a1e51b99bf5bb69fab155f9e1ac44b6402e0b9fb2dab715bbf9c2e09cef366c",
        vout: 0,
        value: 1000,
      }
    : {
        txid: "3b1018753057fb318c410b5d68e65a15213ad8a991e4f7804c99a7c2daf9791e",
        vout: 1,
        value: 7217,
      };

  const wallet = new WIFWallet({
    networkType: TEST_MODE ? "testnet" : "mainnet",
    privateKey: privateKey,
  });

  const keyPair = wallet.ecPair;
  const parentOrdinalStack = createparentInscriptionTapScript(
    keyPair.publicKey,
    itemList
  );

  const ordinal_script = bitcoin.script.compile(parentOrdinalStack);

  const scriptTree: Taptree = {
    output: ordinal_script,
  };

  const redeem = {
    output: ordinal_script,
    redeemVersion: 192,
  };

  const ordinal_p2tr = bitcoin.payments.p2tr({
    internalPubkey: toXOnly(keyPair.publicKey),
    network,
    scriptTree,
    redeem,
  });

  const psbt = new Psbt({ network });

  psbt.addInput({
    hash: utxos.txid,
    index: utxos.vout,
    tapInternalKey: toXOnly(keyPair.publicKey),
    witnessUtxo: { value: utxos.value, script: ordinal_p2tr.output! },
    tapLeafScript: [
      {
        leafVersion: redeem.redeemVersion,
        script: redeem.output,
        controlBlock: ordinal_p2tr.witness![ordinal_p2tr.witness!.length - 1],
      },
    ],
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  psbt.signInput(0, keyPair);
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();

  return tx.virtualSize() * feeRate;
};

export const getInscribe = async (
  receiveAddress: string,
  privateKey: string,
  amount: number,
  hexedPsbt: string,
  signedHexedPsbt: string,
  itemList: ITapItemList[]
) => {
  try {
    const psbt = bitcoin.Psbt.fromHex(hexedPsbt);
    const signedPsbt1 = bitcoin.Psbt.fromHex(signedHexedPsbt);
    psbt.combine(signedPsbt1);
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();

    const txId = await pushRawTx(txHex);
    console.log("SendBTC => ", txId);

    const inscribeId = await generateInscribe(
      receiveAddress,
      privateKey,
      txId,
      amount,
      itemList
    );

    return {
      success: true,
      message: "Transaction is broadcasted successfuly.",
      payload: inscribeId,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Transaction broadcasting get failed.",
      payload: null,
    };
  }
};

export const generateInscribe = async (
  receiveAddress: string,
  privateKey: string,
  txId: string,
  amount: number,
  itemList: ITapItemList[]
) => {
  const wallet = new WIFWallet({
    networkType: TEST_MODE ? "testnet" : "mainnet",
    privateKey: privateKey,
  });
  const keyPair = wallet.ecPair;
  const parentOrdinalStack = createparentInscriptionTapScript(
    keyPair.publicKey,
    itemList
  );

  const ordinal_script = bitcoin.script.compile(parentOrdinalStack);

  const scriptTree: Taptree = {
    output: ordinal_script,
  };

  const redeem = {
    output: ordinal_script,
    redeemVersion: 192,
  };

  const ordinal_p2tr = bitcoin.payments.p2tr({
    internalPubkey: toXOnly(keyPair.publicKey),
    network,
    scriptTree,
    redeem,
  });

  const psbt = new Psbt({ network });

  psbt.addInput({
    hash: txId,
    index: 0,
    tapInternalKey: toXOnly(keyPair.publicKey),
    witnessUtxo: { value: Number(amount), script: ordinal_p2tr.output! },
    tapLeafScript: [
      {
        leafVersion: redeem.redeemVersion,
        script: redeem.output,
        controlBlock: ordinal_p2tr.witness![ordinal_p2tr.witness!.length - 1],
      },
    ],
  });

  psbt.addOutput({
    address: receiveAddress, //Destination Address
    value: 546,
  });

  const inscribeId = await signAndSend(keyPair, psbt);

  return inscribeId;
};

export async function signAndSend(keypair: BTCSigner, psbt: Psbt) {
  psbt.signInput(0, keypair);
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();

  console.log(tx.virtualSize());
  console.log(tx.toHex());

  const txid = await pushRawTx(tx.toHex());
  console.log(`Success! Txid is ${txid}`);

  return txid;
}

interface IUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export async function fetchTapBalanceList(address: string) {
  const url = `${TRAC_NETWORK_API}/getAccountTokensBalance/${address}`;
  const result = await axios.get(url);

  console.log("tap balance url ==> ", url);
  console.log("fetchTapBalanceList result ==> ", result.data.data.list);
  const temp = result.data.data.list;
  if (!temp.length) return [];
  const balanceList: ITapBalance[] = [];
  temp.map((tap: ITapBalance) => {
    balanceList.push({
      ticker: tap.ticker,
      overallBalance: (
        parseInt(tap.overallBalance) / Math.pow(10, 18)
      ).toString(),
      transferableBalance: tap.transferableBalance,
    });
  });
  return balanceList;
}

export async function sendTapOrdinalsController(
  walletId: string,
  inscriptionId: string,
  paymentAddress: string,
  ordinalAddress: string
) {
  console.log("walletId ==> ", walletId);
  console.log("inscriptionId ==> ", inscriptionId);
  console.log("paymentAddress ==> ", paymentAddress);
  console.log("ordinalAddress ==> ", ordinalAddress);

  const multisigVault = await MultisigModal.findById(walletId);
  if (!multisigVault)
    return {
      success: false,
      message: "Not Found Multisig wallet.",
    };

  const { witnessScript, p2msOutput, address, threshold, cosigner, assets } =
    multisigVault;
  const psbt = new Psbt({
    network: TEST_MODE ? networks.testnet : networks.bitcoin,
  });

  if (!multisigVault)
    return {
      success: false,
      message: "There is no wallet with this id.",
      payload: null,
    };

  if (!assets)
    return {
      success: false,
      message: "Not Found Multisig Assets.",
    };

  console.log("multisigVault.address ==> ", multisigVault.address);
  console.log("inscriptionId ==> ", inscriptionId);

  let inscriptionData;
  let count = 1;

  while (1) {
    await delay(20000);
    const tempInscriptionData = await getInscriptionData(
      multisigVault.address,
      inscriptionId
      // "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
    );
    console.log("inscriptionData ==> ", inscriptionData);
    if (tempInscriptionData) {
      console.log("Get inscription Success. ==> ");
      inscriptionData = tempInscriptionData;
      break;
    } else {
      console.log(`${count++}th attemp get failed. Now try again.`);
    }
  }

  console.log("After while statement");

  psbt.addInput({
    hash: inscriptionData.txid,
    index: inscriptionData.vout,
    witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
    witnessUtxo: {
      script: Buffer.from(multisigVault.p2msOutput, "hex"),
      value: inscriptionData.satoshi,
    },
  });

  psbt.addOutput({
    address: multisigVault.address,
    value: inscriptionData.satoshi,
  });

  const btcUtxos = await getBtcUtxoByAddress(address);

  const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);
  let FinalTotalBtcAmount = 0;
  let finalFee = 0;

  // Calc sats for $3
  const feeLevel = await getFeeLevel(ordinalAddress);
  console.log("feeLevel ==> ", feeLevel);
  const serverFeeSats = await usdToSats(
    feeLevel ? SERVICE_FEE_VIP : SERVICE_FEE
  );
  // End calc sats

  for (const btcutxo of btcUtxos) {
    finalFee = await calculateTxFee(psbt, feeRate);
    if (
      FinalTotalBtcAmount < finalFee + serverFeeSats &&
      btcutxo.value > 1000
    ) {
      FinalTotalBtcAmount += btcutxo.value;
      psbt.addInput({
        hash: btcutxo.txid,
        index: btcutxo.vout,
        witnessScript: Buffer.from(witnessScript, "hex"),
        witnessUtxo: {
          script: Buffer.from(p2msOutput, "hex"),
          value: btcutxo.value,
        },
      });
    }
  }

  console.log("Pay finalFee =====================>", finalFee);

  if (FinalTotalBtcAmount < finalFee)
    throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;

  console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  finalFee = await calculateTxFee(psbt, feeRate);

  psbt.addOutput({
    address: address,
    value: FinalTotalBtcAmount - finalFee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: walletId,
    type: RequestType.Tapping,
    transferAmount: 1,
    destinationAddress: multisigVault.address,
    creator: paymentAddress,
    cosigner,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt.toHex() ==> ", psbt.toHex());

  return psbt.toHex();
}

export async function createPendingVaultController(
  vaultName: string,
  addressList: string[],
  minSignCount: number,
  imageUrl: string,
  vaultType: string,
  assets: IAssets,
  creator: IAddress
) {
  const pubkeyList = addressList.map(() => "");
  console.log("pubkeyList ==> ", pubkeyList);
  const newPendingModal = new PendingMultisigModal({
    vaultName,
    addressList,
    pubkeyList,
    threshold: minSignCount,
    vaultType,
    assets,
    imageUrl,
    creator,
  });
  await newPendingModal.save();

  return await PendingMultisigModal.find();
}

export async function joinPendingVaultController(
  res: any,
  pendingVaultId: string,
  ordinalAddress: string,
  ordinalPubkey: string,
  paymentAddress: string,
  paymentPubkey: string
) {
  try {
    const pendingVault = await PendingMultisigModal.findById(pendingVaultId);
    const assets = pendingVault?.assets;

    if (!assets) {
      console.log("input assets ==> ", assets);
      return res.status(200).send({
        success: false,
        message: "There is no assets vault in DB",
        payload: null,
      });
    }

    const addressList = pendingVault?.addressList;
    const pubkeyList = pendingVault?.pubkeyList;

    let cosignerIndex = -1;

    if (!addressList || !pubkeyList)
      return res.status(200).send({
        success: false,
        message: "There is no addressList or PubkeyList in DB",
        payload: null,
      });

    cosignerIndex = addressList.findIndex(
      (address) => address == paymentAddress
    );

    if (cosignerIndex < 0) {
      return res.status(200).send({
        success: false,
        message: "You are not co-signer of this multisig vault",
        payload: null,
      });
    }

    if (pubkeyList[cosignerIndex])
      return res.status(200).send({
        success: false,
        message: "You already joined",
        payload: null,
      });

    pubkeyList[cosignerIndex] = paymentPubkey;

    pendingVault.pubkeyList = pubkeyList;
    await pendingVault.save();

    let joinedCount = 0;
    pubkeyList.map((pubkey: string) => {
      if (pubkey) joinedCount++;
    });

    const vaultName = pendingVault.vaultName;

    console.log("Joined Count ==> ", joinedCount);
    if (joinedCount < pubkeyList.length) {
      return res.status(200).send({
        success: true,
        message: "Joined successfully",
        payload: await PendingMultisigModal.find({ pending: true }),
      });
    } else {
      if (pendingVault.vaultType == VaultType.NativeSegwit) {
        const payload = await createNativeSegwit(
          vaultName,
          pubkeyList,
          pendingVault.threshold,
          assets,
          TEST_MODE ? networks.testnet : networks.bitcoin,
          pendingVault.imageUrl
        );
        pendingVault.pending = false;
        await pendingVault.save();
        return res.status(200).send(payload);
      } else {
        const payload = await createTaprootMultisig(
          vaultName,
          pubkeyList,
          pendingVault.threshold,
          assets,
          pendingVault.imageUrl
        );
        pendingVault.pending = false;
        await pendingVault.save();
        return res.status(200).send(payload);
      }
    }
  } catch (error) {
    return res.status(400).send({
      success: false,
      payload: error,
      message: "Got error in join to Pending Vault",
    });
  }
}
