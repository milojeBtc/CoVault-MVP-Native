import * as Bitcoin from "bitcoinjs-lib";
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { LEAF_VERSION_TAPSCRIPT } from "bitcoinjs-lib/src/payments/bip341";
import BIP32Factory from "bip32";
import { TEST_MODE } from "../config/config";
import { TaprootMultisigWallet } from "../utils/mutisigWallet";
import { getInscriptionData } from "../utils/function";
import { getBtcUtxoByAddress } from "../service/psbt.service";
import { calculateTxFee } from "../service/psbt.service";
import { getFeeRate } from "../utils/mempool";
import { pushRawTx } from "../service/psbt.service";

const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const bip32 = BIP32Factory(ecc);
const rng = require("randombytes");

const ECPair = ECPairFactory(ecc);
const network = TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin; // Otherwise, bitcoin = mainnet and regnet = local

export const createMultiSigWallet = () => {
  try {
    const minSignCount = 1;
    const wifKeyList: any[] = [
      "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
      "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
    ];
    const pubKeyList: string[] = [
      "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
      "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
    ];

    const leafPubkeys = pubKeyList.map((pubkey: string) =>
      toXOnly(Buffer.from(pubkey, "hex"))
    );

    const leafKey = bip32.fromSeed(rng(64), network);

    const multiSigWallet = new TaprootMultisigWallet(
      leafPubkeys,
      minSignCount,
      leafKey.privateKey!,
      LEAF_VERSION_TAPSCRIPT
    ).setNetwork(
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );

    return {
      privateKey: leafKey.privateKey?.toString("hex"),
      address: multiSigWallet.address,
    };
  } catch (error) {
    console.log(error);
  }
};

export const sendOrdinal = async () => {
  try {
    const minSignCount = 1;
    const wifKeyList: any[] = [
      "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
      "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
    ];
    const pubKeyList: string[] = [
      "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
      "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
    ];

    const leafPubkeys = pubKeyList.map((pubkey: string) =>
      toXOnly(Buffer.from(pubkey, "hex"))
    );

    const leafKey = bip32.fromSeed(rng(64), network);

    const multiSigWallet = new TaprootMultisigWallet(
      leafPubkeys,
      minSignCount,
      leafKey.privateKey!,
      LEAF_VERSION_TAPSCRIPT
    ).setNetwork(
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );
    const btcUtxos = await getBtcUtxoByAddress(multiSigWallet.address);

    const psbt = new Bitcoin.Psbt({ network });

    const inscriptionData = await getInscriptionData(
      multiSigWallet.address,
      "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
    );

    multiSigWallet.addInput(
      psbt,
      inscriptionData.txid,
      inscriptionData.vout,
      inscriptionData.satoshi
    );

    psbt.addOutput({
      address: "tb1pss0yzfjl8akaz9a0y3z69573dgk9q7hu2vdnajrkru868u4skmwqp3vkey",
      value: inscriptionData.satoshi,
    });

    let totalBtcAmount = 0;
    const feeRate = (await getFeeRate());

    let fee = calculateTxFee(psbt, feeRate);

    for (const btcutxo of btcUtxos) {
      fee = calculateTxFee(psbt, feeRate);
      if (totalBtcAmount < fee && btcutxo.value > 1000) {
        totalBtcAmount += btcutxo.value;
        multiSigWallet.addInput(
          psbt,
          btcutxo.txid,
          btcutxo.vout,
          btcutxo.value
        );
      }
    }

    fee = calculateTxFee(psbt, feeRate);

    if (totalBtcAmount - fee < 0)
      return {
        success: false,
        message: "You have not enough btc for this transaction",
        payload: null,
      };

    psbt.addOutput({
      address: multiSigWallet.address,
      value: totalBtcAmount - fee - inscriptionData.satoshi,
    });

    const keyPair1 = ECPair.fromWIF(wifKeyList[0], network);
    const keyPair2 = ECPair.fromWIF(wifKeyList[1], network);
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, keyPair1);
    }
    multiSigWallet.addDummySigs(psbt);
    psbt.finalizeAllInputs();

    const RawTx = psbt.extractTransaction().toHex();
    const txId = await pushRawTx(RawTx);
    return {
      success: true,
      message: "Successfully",
      payload: txId,
    };
  } catch (error) {
    console.log(error);
  }
};

// export const createNSMultiSigWallet = () => {
//   try {
//     const minSignCount = 1;
//     const wifKeyList: any[] = [
//       "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
//       "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
//     ];
//     const pubKeyList: string[] = [
//       "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
//       "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
//     ];

//     const hexedPubkeys = pubKeyList.map((pubkey) => Buffer.from(pubkey, "hex"));
//     const p2ms = bitcoin.payments.p2ms({
//       m: minSignCount,
//       pubkeys: hexedPubkeys,
//       network,
//     });
//     const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });

//     return {
//       p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
//       address: p2wsh.address,
//     };
//   } catch (error) {
//     console.log(error);
//   }
// };

export const sendOrdinalNS = async () => {
  try {
    const minSignCount = 1;
    const wifKeyList: any[] = [
      "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
      "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
    ];
    const pubKeyList: string[] = [
      "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
      "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
    ];

    const hexedPubkeys = pubKeyList.map((pubkey) => Buffer.from(pubkey, "hex"));
    const p2ms = bitcoin.payments.p2ms({
      m: minSignCount,
      pubkeys: hexedPubkeys,
      network,
    });
    const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });

    const btcUtxos = await getBtcUtxoByAddress(p2wsh.address);

    const psbt = new Bitcoin.Psbt({ network });

    const inscriptionData = await getInscriptionData(
      p2wsh.address,
      "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
    );

    psbt.addInput({
      hash: inscriptionData.txid,
      index: inscriptionData.vout,
      witnessScript: Buffer.from(p2wsh.redeem.output.toString("hex"), "hex"),
      witnessUtxo: {
        script: Buffer.from(
          "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
          "hex"
        ),
        value: inscriptionData.satoshi,
      },
    });

    psbt.addOutput({
      address: "tb1pss0yzfjl8akaz9a0y3z69573dgk9q7hu2vdnajrkru868u4skmwqp3vkey",
      value: inscriptionData.satoshi,
    });

    let totalBtcAmount = 0;
    const feeRate = (await getFeeRate());

    let fee = calculateTxFee(psbt, feeRate);

    for (const btcutxo of btcUtxos) {
      fee = calculateTxFee(psbt, feeRate);
      if (totalBtcAmount < fee && btcutxo.value > 1000) {
        totalBtcAmount += btcutxo.value;
        psbt.addInput({
          hash: btcutxo.txid,
          index: btcutxo.vout,
          witnessScript: Buffer.from(
            p2wsh.redeem.output.toString("hex"),
            "hex"
          ),
          witnessUtxo: {
            script: Buffer.from(
              "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
              "hex"
            ),
            value: btcutxo.value,
          },
        });
      }
    }

    fee = calculateTxFee(psbt, feeRate);

    if (totalBtcAmount - fee < 0)
      return {
        success: false,
        message: "You have not enough btc for this transaction",
        payload: null,
      };

    psbt.addOutput({
      address: p2wsh.address,
      value: totalBtcAmount - fee - inscriptionData.satoshi,
    });

    const keyPair1 = ECPair.fromWIF(wifKeyList[0], network);
    const keyPair2 = ECPair.fromWIF(wifKeyList[1], network);
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, keyPair1);

      psbt.validateSignaturesOfInput(i, () => true);
      psbt.finalizeInput(i);
    }

    const RawTx = psbt.extractTransaction().toHex();
    const txId = await pushRawTx(RawTx);
    return {
      success: true,
      message: "Successfully",
      payload: txId,
    };
  } catch (error) {
    console.log(error);
  }
};
