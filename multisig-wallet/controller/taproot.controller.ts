import { Router } from "express";

import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { TaprootMultisigWallet } from "../utils/mutisigWallet";
import { LEAF_VERSION_TAPSCRIPT } from "bitcoinjs-lib/src/payments/bip341";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";

import * as Bitcoin from "bitcoinjs-lib";
import axios from "axios";
import TaprootMultisigModal from "../model/TaprootMultisig";
import { FEE_ADDRESS, SERVICE_FEE, SERVICE_FEE_ADDRESS, TEST_MODE } from "../config/config";
import {
  calculateTxFee,
  combinePsbt,
  getAllRuneIdList,
  getBtcUtxoByAddress,
  getFeeRate,
  getRuneUtxoByAddress,
  transferAllAssetsFeeCalc,
} from "../service/psbt.service";
import { IAssets, ITaprootVault, RequestType } from "../type";
import RequestModal from "../model/RequestModal";
import { none, RuneId, Runestone } from "runelib";
import TempTaprootMultisigModal from "../model/TempTaprootMultisig";
import { getInscriptionData, usdToSats } from "../utils/function";

const rng = require("randombytes");

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const network = TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

// tb1p6m6r55qey5j9n3f6ds24kzz7acpcktwwwkrx54k35eqnvqtcx5ps65932q
export const createTaprootMultisig = async (
  vaultName: string,
  pubkeyList: string[],
  threshold: number,
  assets: IAssets,
  imageUrl: string
) => {
  try {
    const leafPubkeys: Buffer[] = pubkeyList.map((pubkey: string) =>
      toXOnly(Buffer.from(pubkey, "hex"))
    );

    const leafKey = bip32.fromSeed(
      rng(64),
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );

    const multiSigWallet = new TaprootMultisigWallet(
      leafPubkeys,
      threshold * 1,
      leafKey.privateKey!,
      LEAF_VERSION_TAPSCRIPT
    ).setNetwork(
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );

    console.log("address ==> ", multiSigWallet.address);

    const newTaproot = new TaprootMultisigModal({
      vaultName,
      cosigner: pubkeyList,
      threshold,
      privateKey: leafKey.privateKey?.toString("hex"),
      tapscript: LEAF_VERSION_TAPSCRIPT,
      address: multiSigWallet.address,
      assets,
      imageUrl,
    });

    await newTaproot.save();

    // return multiSigWallet.address;
    return {
      success: true,
      message: "Create Musig Wallet successfully.",
      payload: {
        DBID: newTaproot._id.toString(),
        address: multiSigWallet.address,
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
};

export const sendBtcTaproot = async (
  id: string,
  amount: number,
  destinationAddress: string,
  paymentAddress: string,
  ordinalAddress: string
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(id);
  console.log(taprootMultisig);

  if (!taprootMultisig) return {
    success: false,
    message: "There is no taproot Multisig wallet",
    payload: null
  };

  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;
  const assets = taprootMultisig.assets;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
  const feeRate = (await getFeeRate());

  let totalBtcAmount = 0;
  const btcUtxos = await getBtcUtxoByAddress(multiSigWallet.address);
  console.log("btcUtxos ==> ", btcUtxos);

  // Calc sats for $3
  const serverFeeSats = await usdToSats(SERVICE_FEE);
  // End calc sats

  for (const btcutxo of btcUtxos) {
    const fee = calculateTxFee(psbt, feeRate);
    if (totalBtcAmount < fee + amount * 1 + 10000 + serverFeeSats && btcutxo.value > 1000) {
      totalBtcAmount += btcutxo.value;
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
    }
  }

  let fee = calculateTxFee(psbt, feeRate);

  console.log("fee + amount + 5000 ==> ", fee + amount * 1 + 5000);
  console.log("totalBtcAmount ==> ", totalBtcAmount);

  if (totalBtcAmount < fee + amount * 1 + 5000)
    return {
      success: false,
      message: "There is not enough btc in this address.",
      payload: null
    };

  psbt.addOutput({
    value: amount * 1,
    address: destinationAddress,
  });

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  fee = calculateTxFee(psbt, feeRate);

  psbt.addOutput({
    value: totalBtcAmount - serverFeeSats - amount - fee,
    address: multiSigWallet.address,
  });

  const newRequest = new RequestModal({
    musigId: id,
    type: RequestType.Tranfer,
    transferAmount: amount,
    destinationAddress: destinationAddress,
    creator: paymentAddress,
    cosigner: pubkeyList,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets,
    pending: "",
  });

  await newRequest.save();

  console.log("psbt", psbt.toHex());
  return {
    success: true,
    message: "Generating PSBT successfully.",
    payload: psbt.toHex()
  };
};

export const sendRuneTaproot = async (
  id: string,
  runeId: string,
  amount: number,
  destinationAddress: string,
  ordinalAddress: string
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(id);
  console.log(taprootMultisig);

  if (!taprootMultisig) return {
    success: false,
    message: "There is no taproot Multisig vault with this id.",
    payload: null
  };

  const address = taprootMultisig.address;
  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(network);

  const psbt = new bitcoin.Psbt({ network });
  const feeRate = (await getFeeRate());

  const runeBlockNumber = parseInt(runeId.split(":")[0]);
  const runeTxout = parseInt(runeId.split(":")[1]);
  const btcUtxos = await getBtcUtxoByAddress(address);
  const runeUtxos = await getRuneUtxoByAddress(address, runeId);
  console.log("btcUtxos ==> ", btcUtxos);
  console.log("runeUtxos ==> ", runeUtxos);

  let tokenSum = 0;

  console.log("Initial FeeRate ==> ", feeRate);

  const transferAmount = amount;
  const edicts: any = [];

  // create rune utxo input && edict
  for (const runeutxo of runeUtxos.runeUtxos) {
    if (tokenSum < transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility) {
      multiSigWallet.addInput(
        psbt,
        runeutxo.txid,
        runeutxo.vout,
        runeutxo.value
      );
      console.log("runeutxo.amount ==> ", runeutxo.amount);
      tokenSum += runeutxo.amount;
    }
  }

  console.log(
    "transferAmount ==> ",
    transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility
  );
  console.log(
    "Rest Amount ==> ",
    tokenSum - transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility
  );
  console.log("tokenSum ==> ", tokenSum);

  edicts.push({
    id: new RuneId(runeBlockNumber, runeTxout),
    amount: transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility,
    output: 1,
  });

  if (
    tokenSum - transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility >
    0
  ) {
    edicts.push({
      id: new RuneId(runeBlockNumber, runeTxout),
      amount:
        tokenSum - transferAmount * 10 ** runeUtxos.runeUtxos[0].divisibility,
      output: 2,
    });
  }

  console.log("tokenSum ==> ", tokenSum);
  console.log("transferAmount ==> ", edicts);

  const mintstone = new Runestone(edicts, none(), none(), none());

  psbt.addOutput({
    script: mintstone.encipher(),
    value: 0,
  });

  psbt.addOutput({
    address: destinationAddress, // rune sender address
    value: 546,
  });

  if (tokenSum - transferAmount > 0) {
    psbt.addOutput({
      address: multiSigWallet.address, // rune sender address
      value: 546,
    });
  }

  // const feeRate = await getFeeRate();
  console.log("feeRate ==> ", feeRate);

  // Calc sats for $3
  const serverFeeSats = await usdToSats(SERVICE_FEE);
  // End calc sats

  // add btc utxo input
  let totalBtcAmount = 0;
  console.log("btcUtxos ==> ", btcUtxos);
  for (const btcutxo of btcUtxos) {
    const fee = calculateTxFee(psbt, feeRate);
    if (totalBtcAmount < fee + serverFeeSats + 10000 && btcutxo.value > 1000) {
      totalBtcAmount += btcutxo.value;
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
    }
  }

  // TODO Consider
  const fee = Math.round(calculateTxFee(psbt, feeRate) * 2);

  console.log("Pay Fee in batch transfer =====================>", fee);
  console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);

  if (totalBtcAmount < fee + serverFeeSats) return {
    success: false,
    message: "Balance is not enough.",
    payload: null
  };

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: multiSigWallet.address,
    value: totalBtcAmount - (fee + serverFeeSats),
  });

  const newRequest = new RequestModal({
    musigId: id,
    type: RequestType.Tranfer,
    transferAmount: amount,
    destinationAddress: destinationAddress,
    creator: ordinalAddress,
    cosigner: pubkeyList,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets: taprootMultisig.assets,
    pending: "",
  });

  await newRequest.save();

  return {
    success: true,
    message: "Generate PSBT successfully.",
    payload: psbt.toHex()
  };
};

export const sendOrdinalTaproot = async (
  id: string,
  inscriptionId: string,
  destinationAddress: string,
  paymentAddress: string,
  ordinalAddress: string
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(id);
  console.log(taprootMultisig);

  if (!taprootMultisig) return {
    success: false,
    message: "There is no taproot Multisig",
    payload: null,
  };

  const address = taprootMultisig.address;
  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(network);

  const psbt = new bitcoin.Psbt({ network });
  const feeRate = (await getFeeRate());

  // Calc sats for $3
  const serverFeeSats = await usdToSats(SERVICE_FEE);
  // End calc sats

  const btcUtxos = await getBtcUtxoByAddress(address);

  console.log("multiSigWallet.address ==> ", multiSigWallet.address);
  console.log("inscriptionId ==> ", inscriptionId);

  const inscriptionData = await getInscriptionData(
    multiSigWallet.address,
    inscriptionId
  );

  multiSigWallet.addInput(
    psbt,
    inscriptionData.txid,
    inscriptionData.vout,
    inscriptionData.satoshi
  );

  psbt.addOutput({
    address: destinationAddress,
    value: inscriptionData.satoshi,
  });

  console.log("feeRate ==> ", feeRate);

  // add btc utxo input
  let totalBtcAmount = 0;
  console.log("btcUtxos ==> ", btcUtxos);
  for (const btcutxo of btcUtxos) {
    const fee = calculateTxFee(psbt, feeRate);
    if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
      totalBtcAmount += btcutxo.value;
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
    }
  }

  const fee = calculateTxFee(psbt, feeRate);

  console.log("Pay Fee in batch transfer =====================>", fee);
  console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);

  if (totalBtcAmount < fee) return {
    success: false,
    message: "There is not enough btc for tx.",
    payload: null,
  }

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: multiSigWallet.address,
    value: totalBtcAmount - fee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: id,
    type: RequestType.OrdinalsTransfer,
    transferAmount: 1,
    destinationAddress: destinationAddress,
    creator: paymentAddress,
    cosigner: pubkeyList,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets: taprootMultisig.assets,
    pending: "",
  });

  await newRequest.save();
  return {
    success: true,
    message: "Generate PSBT for ordinals successfully.",
    payload: psbt.toHex(),
  }
};

export const sendBrc20Taproot = async (
  vaultId: string,
  inscriptionId: string,
  destination: string,
  ticker: string,
  amount: string,
  paymentAddress: string,
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(vaultId);
  console.log(taprootMultisig);

  if (!taprootMultisig) return;

  const address = taprootMultisig.address;
  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(network);

  const psbt = new bitcoin.Psbt({ network });
  const feeRate = (await getFeeRate());

  const btcUtxos = await getBtcUtxoByAddress(address);

  const inscriptionData = await getInscriptionData(
    multiSigWallet.address,
    inscriptionId
  );

  multiSigWallet.addInput(
    psbt,
    inscriptionData.txid,
    inscriptionData.vout,
    inscriptionData.satoshi
  );

  psbt.addOutput({
    address: destination,
    value: inscriptionData.satoshi,
  });

  console.log("feeRate ==> ", feeRate);

  // Calc sats for $3
  const serverFeeSats = await usdToSats(SERVICE_FEE);
  // End calc sats

  // add btc utxo input
  let totalBtcAmount = 0;
  console.log("btcUtxos ==> ", btcUtxos);
  for (const btcutxo of btcUtxos) {
    const fee = calculateTxFee(psbt, feeRate);
    if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
      totalBtcAmount += btcutxo.value;
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
    }
  }

  const fee = calculateTxFee(psbt, feeRate);

  console.log("Pay Fee in batch transfer =====================>", fee);
  console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);

  if (totalBtcAmount < fee) throw "BTC balance is not enough";

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: multiSigWallet.address,
    value: totalBtcAmount - fee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: vaultId,
    type: `${RequestType.Brc20}-${ticker.toUpperCase()}`,
    transferAmount: amount,
    destinationAddress: destination,
    creator: paymentAddress,
    cosigner: pubkeyList,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets: taprootMultisig.assets,
    pending: "",
  });

  await newRequest.save();

  return psbt.toHex();
};

export const sendTapOrdinalTaproot = async (
  id: string,
  inscriptionId: string,
  paymentAddress: string
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(id);
  console.log(taprootMultisig);

  if (!taprootMultisig) return {
    success: false,
    message: "There is no taproot Multisig",
    payload: null,
  };

  const address = taprootMultisig.address;
  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(network);

  const psbt = new bitcoin.Psbt({ network });
  const feeRate = (await getFeeRate());

  const btcUtxos = await getBtcUtxoByAddress(address);

  console.log("multiSigWallet.address ==> ", multiSigWallet.address);
  console.log("inscriptionId ==> ", inscriptionId);

  const inscriptionData = await getInscriptionData(
    multiSigWallet.address,
    inscriptionId
  );

  multiSigWallet.addInput(
    psbt,
    inscriptionData.txid,
    inscriptionData.vout,
    inscriptionData.satoshi
  );

  psbt.addOutput({
    address: taprootMultisig.address,
    value: inscriptionData.satoshi,
  });

  console.log("feeRate ==> ", feeRate);

  // Calc sats for $3
  const serverFeeSats = await usdToSats(SERVICE_FEE);
  // End calc sats

  // add btc utxo input
  let totalBtcAmount = 0;
  console.log("btcUtxos ==> ", btcUtxos);
  for (const btcutxo of btcUtxos) {
    const fee = calculateTxFee(psbt, feeRate);
    if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
      totalBtcAmount += btcutxo.value;
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
    }
  }

  const fee = calculateTxFee(psbt, feeRate);

  console.log("Pay Fee in batch transfer =====================>", fee);
  console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);

  if (totalBtcAmount < fee) return {
    success: false,
    message: "There is not enough btc for tx.",
    payload: null,
  }

  psbt.addOutput({
    address: FEE_ADDRESS,
    value: serverFeeSats,
  });

  psbt.addOutput({
    address: multiSigWallet.address,
    value: totalBtcAmount - fee - serverFeeSats,
  });

  const newRequest = new RequestModal({
    musigId: id,
    type: RequestType.OrdinalsTransfer,
    transferAmount: 1,
    destinationAddress: taprootMultisig.address,
    creator: paymentAddress,
    cosigner: pubkeyList,
    signedCosigner: [],
    psbt: [psbt.toHex()],
    threshold,
    assets: taprootMultisig.assets,
    pending: "",
  });

  await newRequest.save();
  return {
    success: true,
    message: "Generate PSBT for ordinals successfully.",
    payload: psbt.toHex(),
  }
};

export const broadcastPSBT = async (
  id: string,
  psbt: string,
  signedPSBT: string,
  walletType: string
) => {
  const taprootMultisig = await TaprootMultisigModal.findById(id);
  console.log(taprootMultisig);

  if (!taprootMultisig) return;

  const pubkeyList = taprootMultisig.cosigner;
  const threshold = taprootMultisig.threshold;
  const privateKey = taprootMultisig.privateKey;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

  const tempPsbt = Bitcoin.Psbt.fromHex(signedPSBT);
  const inputCount = tempPsbt.inputCount;
  const inputArr = Array.from({ length: inputCount }, (_, index) => index);
  console.log("inputArr in exec ==> ", inputArr);

  console.log("multiSigWallet ==> ", multiSigWallet);
  console.log("signedPSBT ==> ", signedPSBT);

  const tempSignedPSBT = Bitcoin.Psbt.fromHex(signedPSBT);

  multiSigWallet.addDummySigs(tempSignedPSBT);
  tempSignedPSBT.finalizeAllInputs();

  const txID = await combinePsbt(psbt, tempSignedPSBT.toHex());
  // console.log(txID);
};

export const reCreateTaprootMultisig = async (
  pubkeyList: string[],
  threshold: number,
  assets: IAssets,
  imageUrl: string,
  vaultId: string
) => {
  try {
    const existMusigWallet = await TaprootMultisigModal.findOne({
      cosigner: pubkeyList,
    });

    console.log("existMusigWallet ==> ", existMusigWallet);
    console.log("existMusigWallet ==> ", existMusigWallet?._id);
    console.log("vaultId ==> ", vaultId);

    if (existMusigWallet && existMusigWallet._id.toString() != vaultId) {
      console.log("These public key pair is already existed in other wallets.");
      return {
        success: false,
        message: "These public key pair is already existed in other wallets.",
        payload: null,
      };
    }

    const leafPubkeys: Buffer[] = pubkeyList.map((pubkey: string) =>
      toXOnly(Buffer.from(pubkey, "hex"))
    );

    const leafKey = bip32.fromSeed(
      rng(64),
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );

    const multiSigWallet = new TaprootMultisigWallet(
      leafPubkeys,
      threshold * 1,
      leafKey.privateKey!,
      LEAF_VERSION_TAPSCRIPT
    ).setNetwork(
      TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    );

    console.log("address ==> ", multiSigWallet.address);

    const newTaproot = new TempTaprootMultisigModal({
      cosigner: pubkeyList,
      threshold,
      privateKey: leafKey.privateKey?.toString("hex"),
      tapscript: LEAF_VERSION_TAPSCRIPT,
      address: multiSigWallet.address,
      assets,
      imageUrl,
    });

    await newTaproot.save();

    console.log("newTaproot ==> ", newTaproot);

    // return multiSigWallet.address;
    return {
      success: true,
      message: "Create Musig Taproot Wallet temporary.",
      payload: newTaproot,
    };
  } catch (error: any) {
    console.log("error in creating taproot address ==> ", error);
    return {
      success: false,
      message: "There is something error",
      payload: null,
    };
  }
};

export async function transferAllTaprootAssets(
  oldVault: ITaprootVault,
  newVault: ITaprootVault,
  ordinalAddress: string
) {
  console.log("transferAllAssets ==> ");
  const oldAddress = oldVault.address;
  const destinationAddress = newVault.address;
  const thresHoldValue = oldVault.threshold;

  // const { witnessScript, p2msOutput } = oldVault;

  console.log(oldAddress, destinationAddress);

  const btcUtxos = await getBtcUtxoByAddress(oldAddress);
  const runeIdList = await getAllRuneIdList(oldAddress);

  const pubkeyList = oldVault.cosigner;
  const threshold = oldVault.threshold;
  const privateKey = oldVault.privateKey;
  const assets = oldVault.assets;

  const leafPubkeys = pubkeyList.map((pubkey: string) =>
    toXOnly(Buffer.from(pubkey, "hex"))
  );

  const multiSigWallet = new TaprootMultisigWallet(
    leafPubkeys,
    threshold,
    Buffer.from(privateKey, "hex"),
    LEAF_VERSION_TAPSCRIPT
  ).setNetwork(TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

  if (!btcUtxos.length && !runeIdList.length) {
    TempTaprootMultisigModal.findByIdAndDelete(newVault._id);
    throw "There is no any BTC in vault for updating.";
  }

  const psbt = new bitcoin.Psbt({ network });

  // Rune utxo input
  for (const runeId of runeIdList) {
    const runeUtxos = await getRuneUtxoByAddress(oldAddress, runeId);
    console.log("runeUtxos ======>", runeUtxos.runeUtxos);

    // create rune utxo input && edict
    for (const runeutxo of runeUtxos.runeUtxos) {
      // psbt.addInput({
      //   hash: runeutxo.txid,
      //   index: runeutxo.vout,
      //   witnessScript: Buffer.from(witnessScript, "hex"),
      //   witnessUtxo: {
      //     script: Buffer.from(p2msOutput, "hex"),
      //     value: runeutxo.value,
      //   },
      // });
      multiSigWallet.addInput(
        psbt,
        runeutxo.txid,
        runeutxo.vout,
        runeutxo.value
      );
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
      multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
      // psbt.addInput({
      //   hash: btcutxo.txid,
      //   index: btcutxo.vout,
      //   witnessScript: Buffer.from(witnessScript, "hex"),
      //   witnessUtxo: {
      //     script: Buffer.from(p2msOutput, "hex"),
      //     value: btcutxo.value,
      //   },
      // });
    }
  }

  const feeRate = Math.floor(await getFeeRate());
  console.log("feeRate ==> ", feeRate);
  // console.log("psbt ==> ", psbt);

  psbt.addOutput({
    address: SERVICE_FEE_ADDRESS,
    value: SERVICE_FEE,
  });

  const fee = transferAllAssetsFeeCalc(psbt, feeRate, thresHoldValue);

  console.log("Pay Fee ==>", fee);

  if (totalBtcAmount < fee) {
    TempTaprootMultisigModal.findByIdAndDelete(newVault._id);
    throw "BTC balance is not enough for pay fee";
  }

  console.log("totalBtcAmount ====>", totalBtcAmount);

  psbt.addOutput({
    address: destinationAddress,
    value: totalBtcAmount - SERVICE_FEE - fee,
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
