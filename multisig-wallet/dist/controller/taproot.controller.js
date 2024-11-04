"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferAllTaprootAssets = exports.reCreateTaprootMultisig = exports.broadcastPSBT = exports.sendTapOrdinalTaproot = exports.sendBrc20Taproot = exports.sendOrdinalTaproot = exports.sendRuneTaproot = exports.sendBtcTaproot = exports.createTaprootMultisig = void 0;
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const mutisigWallet_1 = require("../utils/mutisigWallet");
const bip341_1 = require("bitcoinjs-lib/src/payments/bip341");
const ecc = __importStar(require("tiny-secp256k1"));
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip32_1 = __importDefault(require("bip32"));
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const TaprootMultisig_1 = __importDefault(require("../model/TaprootMultisig"));
const config_1 = require("../config/config");
const psbt_service_1 = require("../service/psbt.service");
const RequestModal_1 = __importDefault(require("../model/RequestModal"));
const runelib_1 = require("runelib");
const TempTaprootMultisig_1 = __importDefault(require("../model/TempTaprootMultisig"));
const function_1 = require("../utils/function");
const rng = require("randombytes");
bitcoin.initEccLib(ecc);
const bip32 = (0, bip32_1.default)(ecc);
const network = config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
// tb1p6m6r55qey5j9n3f6ds24kzz7acpcktwwwkrx54k35eqnvqtcx5ps65932q
const createTaprootMultisig = (pubkeyList, threshold, assets, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
        const leafKey = bip32.fromSeed(rng(64), config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold * 1, leafKey.privateKey, bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        console.log("address ==> ", multiSigWallet.address);
        const newTaproot = new TaprootMultisig_1.default({
            cosigner: pubkeyList,
            threshold,
            privateKey: (_a = leafKey.privateKey) === null || _a === void 0 ? void 0 : _a.toString("hex"),
            tapscript: bip341_1.LEAF_VERSION_TAPSCRIPT,
            address: multiSigWallet.address,
            assets,
            imageUrl,
        });
        yield newTaproot.save();
        // return multiSigWallet.address;
        return {
            success: true,
            message: "Create Musig Wallet successfully.",
            payload: {
                DBID: newTaproot._id.toString(),
                address: multiSigWallet.address,
            },
        };
    }
    catch (error) {
        console.log("error in creating segwit address ==> ", error);
        return {
            success: false,
            message: "There is something error",
            payload: null,
        };
    }
});
exports.createTaprootMultisig = createTaprootMultisig;
const sendBtcTaproot = (id, amount, destinationAddress, paymentAddress, ordinalAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(id);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return {
            success: false,
            message: "There is no taproot Multisig wallet",
            payload: null
        };
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const assets = taprootMultisig.assets;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    const feeRate = (yield (0, psbt_service_1.getFeeRate)());
    let totalBtcAmount = 0;
    const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(multiSigWallet.address);
    console.log("btcUtxos ==> ", btcUtxos);
    // Calc sats for $3
    const serverFeeSats = yield (0, function_1.usdToSats)(config_1.SERVICE_FEE);
    // End calc sats
    for (const btcutxo of btcUtxos) {
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + amount * 1 + 10000 + serverFeeSats && btcutxo.value > 1000) {
            totalBtcAmount += btcutxo.value;
            multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
        }
    }
    let fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
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
        address: config_1.FEE_ADDRESS,
        value: serverFeeSats,
    });
    fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
    psbt.addOutput({
        value: totalBtcAmount - serverFeeSats - amount - fee,
        address: multiSigWallet.address,
    });
    const newRequest = new RequestModal_1.default({
        musigId: id,
        type: "Tranfer" /* RequestType.Tranfer */,
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
    yield newRequest.save();
    console.log("psbt", psbt.toHex());
    return {
        success: true,
        message: "Generating PSBT successfully.",
        payload: psbt.toHex()
    };
});
exports.sendBtcTaproot = sendBtcTaproot;
const sendRuneTaproot = (id, runeId, amount, destinationAddress, ordinalAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(id);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return {
            success: false,
            message: "There is no taproot Multisig vault with this id.",
            payload: null
        };
    const address = taprootMultisig.address;
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(network);
    const psbt = new bitcoin.Psbt({ network });
    const feeRate = (yield (0, psbt_service_1.getFeeRate)());
    const runeBlockNumber = parseInt(runeId.split(":")[0]);
    const runeTxout = parseInt(runeId.split(":")[1]);
    const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
    const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(address, runeId);
    console.log("btcUtxos ==> ", btcUtxos);
    console.log("runeUtxos ==> ", runeUtxos);
    let tokenSum = 0;
    console.log("Initial FeeRate ==> ", feeRate);
    const transferAmount = amount;
    const edicts = [];
    // create rune utxo input && edict
    for (const runeutxo of runeUtxos.runeUtxos) {
        if (tokenSum < transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility)) {
            multiSigWallet.addInput(psbt, runeutxo.txid, runeutxo.vout, runeutxo.value);
            console.log("runeutxo.amount ==> ", runeutxo.amount);
            tokenSum += runeutxo.amount;
        }
    }
    console.log("transferAmount ==> ", transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
    console.log("Rest Amount ==> ", tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
    console.log("tokenSum ==> ", tokenSum);
    edicts.push({
        id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
        amount: transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
        output: 1,
    });
    if (tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
        0) {
        edicts.push({
            id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
            amount: tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
            output: 2,
        });
    }
    console.log("tokenSum ==> ", tokenSum);
    console.log("transferAmount ==> ", edicts);
    const mintstone = new runelib_1.Runestone(edicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0,
    });
    psbt.addOutput({
        address: destinationAddress,
        value: 546,
    });
    if (tokenSum - transferAmount > 0) {
        psbt.addOutput({
            address: multiSigWallet.address,
            value: 546,
        });
    }
    // const feeRate = await getFeeRate();
    console.log("feeRate ==> ", feeRate);
    // Calc sats for $3
    const serverFeeSats = yield (0, function_1.usdToSats)(config_1.SERVICE_FEE);
    // End calc sats
    // add btc utxo input
    let totalBtcAmount = 0;
    console.log("btcUtxos ==> ", btcUtxos);
    for (const btcutxo of btcUtxos) {
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + serverFeeSats + 10000 && btcutxo.value > 1000) {
            totalBtcAmount += btcutxo.value;
            multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
        }
    }
    // TODO Consider
    const fee = Math.round((0, psbt_service_1.calculateTxFee)(psbt, feeRate) * 2);
    console.log("Pay Fee in batch transfer =====================>", fee);
    console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);
    if (totalBtcAmount < fee + serverFeeSats)
        return {
            success: false,
            message: "Balance is not enough.",
            payload: null
        };
    psbt.addOutput({
        address: config_1.FEE_ADDRESS,
        value: serverFeeSats,
    });
    psbt.addOutput({
        address: multiSigWallet.address,
        value: totalBtcAmount - (fee + serverFeeSats),
    });
    const newRequest = new RequestModal_1.default({
        musigId: id,
        type: "Tranfer" /* RequestType.Tranfer */,
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
    yield newRequest.save();
    return {
        success: true,
        message: "Generate PSBT successfully.",
        payload: psbt.toHex()
    };
});
exports.sendRuneTaproot = sendRuneTaproot;
const sendOrdinalTaproot = (id, inscriptionId, destinationAddress, paymentAddress, ordinalAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(id);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return {
            success: false,
            message: "There is no taproot Multisig",
            payload: null,
        };
    const address = taprootMultisig.address;
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(network);
    const psbt = new bitcoin.Psbt({ network });
    const feeRate = (yield (0, psbt_service_1.getFeeRate)());
    // Calc sats for $3
    const serverFeeSats = yield (0, function_1.usdToSats)(config_1.SERVICE_FEE);
    // End calc sats
    const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
    console.log("multiSigWallet.address ==> ", multiSigWallet.address);
    console.log("inscriptionId ==> ", inscriptionId);
    const inscriptionData = yield (0, function_1.getInscriptionData)(multiSigWallet.address, inscriptionId);
    multiSigWallet.addInput(psbt, inscriptionData.txid, inscriptionData.vout, inscriptionData.satoshi);
    psbt.addOutput({
        address: destinationAddress,
        value: inscriptionData.satoshi,
    });
    console.log("feeRate ==> ", feeRate);
    // add btc utxo input
    let totalBtcAmount = 0;
    console.log("btcUtxos ==> ", btcUtxos);
    for (const btcutxo of btcUtxos) {
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
            totalBtcAmount += btcutxo.value;
            multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
        }
    }
    const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
    console.log("Pay Fee in batch transfer =====================>", fee);
    console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);
    if (totalBtcAmount < fee)
        return {
            success: false,
            message: "There is not enough btc for tx.",
            payload: null,
        };
    psbt.addOutput({
        address: config_1.FEE_ADDRESS,
        value: serverFeeSats,
    });
    psbt.addOutput({
        address: multiSigWallet.address,
        value: totalBtcAmount - fee - serverFeeSats,
    });
    const newRequest = new RequestModal_1.default({
        musigId: id,
        type: "OrdinalsTransfer" /* RequestType.OrdinalsTransfer */,
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
    yield newRequest.save();
    return {
        success: true,
        message: "Generate PSBT for ordinals successfully.",
        payload: psbt.toHex(),
    };
});
exports.sendOrdinalTaproot = sendOrdinalTaproot;
const sendBrc20Taproot = (vaultId, inscriptionId, destination, ticker, amount, paymentAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(vaultId);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return;
    const address = taprootMultisig.address;
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(network);
    const psbt = new bitcoin.Psbt({ network });
    const feeRate = (yield (0, psbt_service_1.getFeeRate)());
    const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
    const inscriptionData = yield (0, function_1.getInscriptionData)(multiSigWallet.address, inscriptionId);
    multiSigWallet.addInput(psbt, inscriptionData.txid, inscriptionData.vout, inscriptionData.satoshi);
    psbt.addOutput({
        address: destination,
        value: inscriptionData.satoshi,
    });
    console.log("feeRate ==> ", feeRate);
    // Calc sats for $3
    const serverFeeSats = yield (0, function_1.usdToSats)(config_1.SERVICE_FEE);
    // End calc sats
    // add btc utxo input
    let totalBtcAmount = 0;
    console.log("btcUtxos ==> ", btcUtxos);
    for (const btcutxo of btcUtxos) {
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
            totalBtcAmount += btcutxo.value;
            multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
        }
    }
    const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
    console.log("Pay Fee in batch transfer =====================>", fee);
    console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);
    if (totalBtcAmount < fee)
        throw "BTC balance is not enough";
    psbt.addOutput({
        address: config_1.FEE_ADDRESS,
        value: serverFeeSats,
    });
    psbt.addOutput({
        address: multiSigWallet.address,
        value: totalBtcAmount - fee - serverFeeSats,
    });
    const newRequest = new RequestModal_1.default({
        musigId: vaultId,
        type: `${"Brc20" /* RequestType.Brc20 */}-${ticker.toUpperCase()}`,
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
    yield newRequest.save();
    return psbt.toHex();
});
exports.sendBrc20Taproot = sendBrc20Taproot;
const sendTapOrdinalTaproot = (id, inscriptionId, paymentAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(id);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return {
            success: false,
            message: "There is no taproot Multisig",
            payload: null,
        };
    const address = taprootMultisig.address;
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(network);
    const psbt = new bitcoin.Psbt({ network });
    const feeRate = (yield (0, psbt_service_1.getFeeRate)());
    const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
    console.log("multiSigWallet.address ==> ", multiSigWallet.address);
    console.log("inscriptionId ==> ", inscriptionId);
    const inscriptionData = yield (0, function_1.getInscriptionData)(multiSigWallet.address, inscriptionId);
    multiSigWallet.addInput(psbt, inscriptionData.txid, inscriptionData.vout, inscriptionData.satoshi);
    psbt.addOutput({
        address: taprootMultisig.address,
        value: inscriptionData.satoshi,
    });
    console.log("feeRate ==> ", feeRate);
    // Calc sats for $3
    const serverFeeSats = yield (0, function_1.usdToSats)(config_1.SERVICE_FEE);
    // End calc sats
    // add btc utxo input
    let totalBtcAmount = 0;
    console.log("btcUtxos ==> ", btcUtxos);
    for (const btcutxo of btcUtxos) {
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + 10000 + serverFeeSats && btcutxo.value > 1000) {
            totalBtcAmount += btcutxo.value;
            multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
        }
    }
    const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
    console.log("Pay Fee in batch transfer =====================>", fee);
    console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);
    if (totalBtcAmount < fee)
        return {
            success: false,
            message: "There is not enough btc for tx.",
            payload: null,
        };
    psbt.addOutput({
        address: config_1.FEE_ADDRESS,
        value: serverFeeSats,
    });
    psbt.addOutput({
        address: multiSigWallet.address,
        value: totalBtcAmount - fee - serverFeeSats,
    });
    const newRequest = new RequestModal_1.default({
        musigId: id,
        type: "OrdinalsTransfer" /* RequestType.OrdinalsTransfer */,
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
    yield newRequest.save();
    return {
        success: true,
        message: "Generate PSBT for ordinals successfully.",
        payload: psbt.toHex(),
    };
});
exports.sendTapOrdinalTaproot = sendTapOrdinalTaproot;
const broadcastPSBT = (id, psbt, signedPSBT, walletType) => __awaiter(void 0, void 0, void 0, function* () {
    const taprootMultisig = yield TaprootMultisig_1.default.findById(id);
    console.log(taprootMultisig);
    if (!taprootMultisig)
        return;
    const pubkeyList = taprootMultisig.cosigner;
    const threshold = taprootMultisig.threshold;
    const privateKey = taprootMultisig.privateKey;
    const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
    const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
    const tempPsbt = Bitcoin.Psbt.fromHex(signedPSBT);
    const inputCount = tempPsbt.inputCount;
    const inputArr = Array.from({ length: inputCount }, (_, index) => index);
    console.log("inputArr in exec ==> ", inputArr);
    console.log("multiSigWallet ==> ", multiSigWallet);
    console.log("signedPSBT ==> ", signedPSBT);
    const tempSignedPSBT = Bitcoin.Psbt.fromHex(signedPSBT);
    multiSigWallet.addDummySigs(tempSignedPSBT);
    tempSignedPSBT.finalizeAllInputs();
    const txID = yield (0, psbt_service_1.combinePsbt)(psbt, tempSignedPSBT.toHex());
    // console.log(txID);
});
exports.broadcastPSBT = broadcastPSBT;
const reCreateTaprootMultisig = (pubkeyList, threshold, assets, imageUrl, vaultId) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const existMusigWallet = yield TaprootMultisig_1.default.findOne({
            cosigner: pubkeyList,
        });
        console.log("existMusigWallet ==> ", existMusigWallet);
        console.log("existMusigWallet ==> ", existMusigWallet === null || existMusigWallet === void 0 ? void 0 : existMusigWallet._id);
        console.log("vaultId ==> ", vaultId);
        if (existMusigWallet && existMusigWallet._id.toString() != vaultId) {
            console.log("These public key pair is already existed in other wallets.");
            return {
                success: false,
                message: "These public key pair is already existed in other wallets.",
                payload: null,
            };
        }
        const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
        const leafKey = bip32.fromSeed(rng(64), config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold * 1, leafKey.privateKey, bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        console.log("address ==> ", multiSigWallet.address);
        const newTaproot = new TempTaprootMultisig_1.default({
            cosigner: pubkeyList,
            threshold,
            privateKey: (_b = leafKey.privateKey) === null || _b === void 0 ? void 0 : _b.toString("hex"),
            tapscript: bip341_1.LEAF_VERSION_TAPSCRIPT,
            address: multiSigWallet.address,
            assets,
            imageUrl,
        });
        yield newTaproot.save();
        console.log("newTaproot ==> ", newTaproot);
        // return multiSigWallet.address;
        return {
            success: true,
            message: "Create Musig Taproot Wallet temporary.",
            payload: newTaproot,
        };
    }
    catch (error) {
        console.log("error in creating taproot address ==> ", error);
        return {
            success: false,
            message: "There is something error",
            payload: null,
        };
    }
});
exports.reCreateTaprootMultisig = reCreateTaprootMultisig;
function transferAllTaprootAssets(oldVault, newVault, ordinalAddress) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        console.log("transferAllAssets ==> ");
        const oldAddress = oldVault.address;
        const destinationAddress = newVault.address;
        const thresHoldValue = oldVault.threshold;
        // const { witnessScript, p2msOutput } = oldVault;
        console.log(oldAddress, destinationAddress);
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(oldAddress);
        const runeIdList = yield (0, psbt_service_1.getAllRuneIdList)(oldAddress);
        const pubkeyList = oldVault.cosigner;
        const threshold = oldVault.threshold;
        const privateKey = oldVault.privateKey;
        const assets = oldVault.assets;
        const leafPubkeys = pubkeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
        const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, threshold, Buffer.from(privateKey, "hex"), bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        if (!btcUtxos.length && !runeIdList.length) {
            TempTaprootMultisig_1.default.findByIdAndDelete(newVault._id);
            throw "There is no any BTC in vault for updating.";
        }
        const psbt = new bitcoin.Psbt({ network });
        // Rune utxo input
        for (const runeId of runeIdList) {
            const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(oldAddress, runeId);
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
                multiSigWallet.addInput(psbt, runeutxo.txid, runeutxo.vout, runeutxo.value);
                psbt.addOutput({
                    address: destinationAddress,
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
        const feeRate = Math.floor(yield (0, psbt_service_1.getFeeRate)());
        console.log("feeRate ==> ", feeRate);
        // console.log("psbt ==> ", psbt);
        psbt.addOutput({
            address: config_1.SERVICE_FEE_ADDRESS,
            value: config_1.SERVICE_FEE,
        });
        const fee = (0, psbt_service_1.transferAllAssetsFeeCalc)(psbt, feeRate, thresHoldValue);
        console.log("Pay Fee ==>", fee);
        if (totalBtcAmount < fee) {
            TempTaprootMultisig_1.default.findByIdAndDelete(newVault._id);
            throw "BTC balance is not enough for pay fee";
        }
        console.log("totalBtcAmount ====>", totalBtcAmount);
        psbt.addOutput({
            address: destinationAddress,
            value: totalBtcAmount - config_1.SERVICE_FEE - fee,
        });
        console.log("psbt ==> ");
        console.log(psbt);
        console.log("psbt ============>", psbt.toHex());
        // Make the request
        const newRequest = new RequestModal_1.default({
            musigId: oldVault._id,
            type: "VaultUpgrade" /* RequestType.VaultUpgrade */,
            transferAmount: "ALL",
            destinationAddress,
            creator: ordinalAddress,
            signedCosigner: [],
            cosigner: oldVault.cosigner,
            psbt: [psbt.toHex()],
            threshold: oldVault.threshold,
            assets: {
                initialPrice: (_a = oldVault.assets) === null || _a === void 0 ? void 0 : _a.initialPrice,
                runeName: (_b = oldVault.assets) === null || _b === void 0 ? void 0 : _b.runeName,
                runeAmount: (_c = oldVault.assets) === null || _c === void 0 ? void 0 : _c.runeAmount,
                runeSymbol: (_d = oldVault.assets) === null || _d === void 0 ? void 0 : _d.runeSymbol,
                creatorAddress: (_e = oldVault.assets) === null || _e === void 0 ? void 0 : _e.creatorAddress,
            },
            pending: "",
        });
        yield newRequest.save();
        return {
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
        };
    });
}
exports.transferAllTaprootAssets = transferAllTaprootAssets;
