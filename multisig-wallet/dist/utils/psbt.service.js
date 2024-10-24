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
exports.waitUntilUTXO = exports.broadcastPSBT = exports.finalizePsbtInput0 = exports.inscribeRunePSBT = exports.inscribeImagePSBT = exports.finalizePsbtInput = exports.pushRawTx = exports.combinePsbt = exports.generateSendBTCPSBT = exports.generateSendOrdinalPSBT = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const utils_service_1 = require("./utils.service");
const WIFWallet_1 = require("./WIFWallet");
const runelib_1 = require("runelib");
const localWallet_1 = require("./localWallet");
Bitcoin.initEccLib(ecc);
const network = config_1.TEST_MODE
    ? Bitcoin.networks.testnet
    : Bitcoin.networks.bitcoin;
const wallet = new WIFWallet_1.WIFWallet({
    networkType: config_1.TEST_MODE ? "testnet" : "mainnet",
    privateKey: config_1.WIF_KEY,
});
const localWallet = new localWallet_1.LocalWallet(config_1.WIF_KEY, config_1.TEST_MODE ? 1 : 0);
const blockstream = new axios_1.default.Axios({ baseURL: config_1.MEMPOOL_URL });
// Get Inscription UTXO
const getInscriptionWithUtxo = (inscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/inscription/info/${inscriptionId}`;
        const config = {
            headers: {
                Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
            },
        };
        const res = yield axios_1.default.get(url, config);
        if (res.data.code === -1)
            throw "Invalid inscription id";
        return {
            address: res.data.data.address,
            contentType: res.data.data.contentType,
            inscriptionId: inscriptionId,
            inscriptionNumber: res.data.data.inscriptionNumber,
            txid: res.data.data.utxo.txid,
            value: res.data.data.utxo.satoshi,
            vout: res.data.data.utxo.vout,
            scriptpubkey: res.data.data.utxo.scriptPk,
        };
    }
    catch (error) {
        console.log(`Ordinal api is not working now, please try again later Or invalid inscription id ${inscriptionId}`);
        throw "Invalid inscription id";
    }
});
// Get BTC UTXO
const getBtcUtxoByAddress = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/utxo-data`;
    const config = {
        headers: {
            Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
        },
    };
    let cursor = 0;
    const size = 5000;
    const utxos = [];
    while (1) {
        const res = yield axios_1.default.get(url, Object.assign(Object.assign({}, config), { params: { cursor, size } }));
        if (res.data.code === -1)
            throw "Invalid Address";
        utxos.push(...res.data.data.utxo.map((utxo) => {
            return {
                scriptpubkey: utxo.scriptPk,
                txid: utxo.txid,
                value: utxo.satoshi,
                vout: utxo.vout,
            };
        }));
        cursor += res.data.data.utxo.length;
        if (cursor === res.data.data.total)
            break;
    }
    return utxos;
});
// Get Current Network Fee
const getFeeRate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/v1/fees/recommended`;
        const res = yield axios_1.default.get(url);
        return res.data.fastestFee;
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return -1;
    }
});
// Calc Tx Fee
const calculateTxFee = (psbt, feeRate) => {
    const tx = new Bitcoin.Transaction();
    for (let i = 0; i < psbt.txInputs.length; i++) {
        const txInput = psbt.txInputs[i];
        tx.addInput(txInput.hash, txInput.index, txInput.sequence);
        tx.setWitness(i, [Buffer.alloc(config_1.SIGNATURE_SIZE)]);
    }
    for (let txOutput of psbt.txOutputs) {
        tx.addOutput(txOutput.script, txOutput.value);
    }
    tx.addOutput(psbt.txOutputs[0].script, psbt.txOutputs[0].value);
    tx.addOutput(psbt.txOutputs[0].script, psbt.txOutputs[0].value);
    return tx.virtualSize() * feeRate;
};
const getTxHexById = (txId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(`https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx/${txId}/hex`);
        return data;
    }
    catch (error) {
        console.log("Mempool api error. Can not get transaction hex");
        throw "Mempool api is not working now. Try again later";
    }
});
// Generate Send Ordinal PSBT
const generateSendOrdinalPSBT = (sellerWalletType, buyerWalletType, inscriptionId, buyerPaymentPubkey, buyerOrdinalAddress, buyerOrdinalPubkey, sellerPaymentAddress, sellerOrdinalPubkey, price) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inscription id", inscriptionId);
    const sellerInscriptionsWithUtxo = yield getInscriptionWithUtxo(inscriptionId);
    const sellerScriptpubkey = Buffer.from(sellerInscriptionsWithUtxo.scriptpubkey, "hex");
    const psbt = new Bitcoin.Psbt({ network: network });
    // Add Inscription Input
    psbt.addInput({
        hash: sellerInscriptionsWithUtxo.txid,
        index: sellerInscriptionsWithUtxo.vout,
        witnessUtxo: {
            value: sellerInscriptionsWithUtxo.value,
            script: sellerScriptpubkey,
        },
        tapInternalKey: sellerWalletType === config_2.WalletTypes.XVERSE ||
            sellerWalletType === config_2.WalletTypes.OKX
            ? Buffer.from(sellerOrdinalPubkey, "hex")
            : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
    });
    // Add Inscription Output to buyer's address
    psbt.addOutput({
        address: buyerOrdinalAddress,
        value: sellerInscriptionsWithUtxo.value,
    });
    let paymentAddress, paymentoutput;
    if (buyerWalletType === config_2.WalletTypes.XVERSE) {
        const hexedPaymentPubkey = Buffer.from(buyerPaymentPubkey, "hex");
        const p2wpkh = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        const { address, redeem } = Bitcoin.payments.p2sh({
            redeem: p2wpkh,
            network: network,
        });
        paymentAddress = address;
        paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
    }
    else if (buyerWalletType === config_2.WalletTypes.UNISAT ||
        buyerWalletType === config_2.WalletTypes.OKX) {
        paymentAddress = buyerOrdinalAddress;
    }
    const btcUtxos = yield getBtcUtxoByAddress(paymentAddress);
    const feeRate = yield getFeeRate();
    let amount = 0;
    const buyerPaymentsignIndexes = [];
    for (const utxo of btcUtxos) {
        const fee = calculateTxFee(psbt, feeRate);
        if (amount < price + fee && utxo.value > 1000) {
            amount += utxo.value;
            buyerPaymentsignIndexes.push(psbt.inputCount);
            if (buyerWalletType === config_2.WalletTypes.UNISAT ||
                buyerWalletType === config_2.WalletTypes.OKX) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                    tapInternalKey: buyerWalletType === config_2.WalletTypes.OKX
                        ? Buffer.from(buyerOrdinalPubkey, "hex")
                        : Buffer.from(buyerOrdinalPubkey, "hex").slice(1, 33),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                });
            }
            else if (buyerWalletType === config_2.WalletTypes.XVERSE) {
                const txHex = yield getTxHexById(utxo.txid);
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    redeemScript: paymentoutput,
                    nonWitnessUtxo: Buffer.from(txHex, "hex"),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                });
            }
        }
    }
    const fee = calculateTxFee(psbt, feeRate);
    if (amount < price + fee)
        throw "You do not have enough bitcoin in your wallet";
    if (price > 0)
        psbt.addOutput({ address: sellerPaymentAddress, value: price });
    psbt.addOutput({
        address: paymentAddress,
        value: amount - price - fee,
    });
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
});
exports.generateSendOrdinalPSBT = generateSendOrdinalPSBT;
// Generate Send BTC PSBT
const generateSendBTCPSBT = (walletType, buyerPaymentPubkey, buyerOrdinalAddress, buyerOrdinalPubkey, sellerPaymentAddress, price) => __awaiter(void 0, void 0, void 0, function* () {
    const psbt = new Bitcoin.Psbt({ network: network });
    // Add Inscription Input
    let paymentAddress, paymentoutput;
    if (walletType === config_2.WalletTypes.XVERSE) {
        const hexedPaymentPubkey = Buffer.from(buyerPaymentPubkey, "hex");
        const p2wpkh = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        const { address, redeem } = Bitcoin.payments.p2sh({
            redeem: p2wpkh,
            network: network,
        });
        paymentAddress = address;
        paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
    }
    else if (walletType === config_2.WalletTypes.UNISAT ||
        walletType === config_2.WalletTypes.OKX) {
        paymentAddress = buyerOrdinalAddress;
    }
    else if (walletType === config_2.WalletTypes.HIRO) {
        const hexedPaymentPubkey = Buffer.from(buyerPaymentPubkey, "hex");
        const { address, output } = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        paymentAddress = address;
    }
    console.log(paymentAddress);
    const btcUtxos = yield getBtcUtxoByAddress(paymentAddress);
    const feeRate = yield getFeeRate();
    let amount = 0;
    const buyerPaymentsignIndexes = [];
    for (const utxo of btcUtxos) {
        if (amount < price && utxo.value > 1000) {
            amount += utxo.value;
            buyerPaymentsignIndexes.push(psbt.inputCount);
            if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                    tapInternalKey: walletType === config_2.WalletTypes.OKX
                        ? Buffer.from(buyerOrdinalPubkey, "hex")
                        : Buffer.from(buyerOrdinalPubkey, "hex").slice(1, 33),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                });
            }
            else if (walletType === config_2.WalletTypes.HIRO) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                });
            }
            else if (walletType === config_2.WalletTypes.XVERSE) {
                const txHex = yield getTxHexById(utxo.txid);
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    redeemScript: paymentoutput,
                    nonWitnessUtxo: Buffer.from(txHex, "hex"),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                });
            }
        }
    }
    if (price > 0) {
        psbt.addOutput({
            address: sellerPaymentAddress,
            value: parseInt((((price * (100 - config_1.SERVICE_FEE_PERCENT)) / 100) * Math.pow(10, 8)).toString()),
        });
        psbt.addOutput({
            address: config_1.ADMIN_PAYMENT_ADDRESS,
            value: parseInt((((price * config_1.SERVICE_FEE_PERCENT) / 100) * Math.pow(10, 8)).toString()),
        });
    }
    const fee = calculateTxFee(psbt, feeRate);
    if (amount < price + fee)
        throw "You do not have enough bitcoin in your wallet";
    psbt.addOutput({
        address: paymentAddress,
        value: amount - parseInt((price * Math.pow(10, 8)).toString()) - fee,
    });
    console.log(psbt.toBase64());
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
});
exports.generateSendBTCPSBT = generateSendBTCPSBT;
const combinePsbt = (hexedPsbt, signedHexedPsbt1, signedHexedPsbt2) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
        const signedPsbt1 = Bitcoin.Psbt.fromHex(signedHexedPsbt1);
        if (signedHexedPsbt2) {
            const signedPsbt2 = Bitcoin.Psbt.fromHex(signedHexedPsbt2);
            psbt.combine(signedPsbt1, signedPsbt2);
        }
        else {
            psbt.combine(signedPsbt1);
        }
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();
        const txId = yield (0, exports.pushRawTx)(txHex);
        return txId;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
});
exports.combinePsbt = combinePsbt;
const pushRawTx = (rawTx) => __awaiter(void 0, void 0, void 0, function* () {
    const txid = yield postData(`https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx`, rawTx);
    console.log("pushed txid", txid);
    return txid;
});
exports.pushRawTx = pushRawTx;
const postData = (url, json, content_type = "text/plain", apikey = "") => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    while (1) {
        try {
            const headers = {};
            if (content_type)
                headers["Content-Type"] = content_type;
            if (apikey)
                headers["X-Api-Key"] = apikey;
            const res = yield axios_1.default.post(url, json, {
                headers,
            });
            return res.data;
        }
        catch (err) {
            const axiosErr = err;
            console.log("push tx error", (_a = axiosErr.response) === null || _a === void 0 ? void 0 : _a.data);
            if (!((_b = axiosErr.response) === null || _b === void 0 ? void 0 : _b.data).includes('sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'))
                throw new Error("Got an err when push tx");
        }
    }
});
const finalizePsbtInput = (hexedPsbt, inputs) => {
    const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
    inputs.forEach((input) => psbt.finalizeInput(input));
    return psbt.toHex();
};
exports.finalizePsbtInput = finalizePsbtInput;
// Generate Inscribe Image PSBT
const inscribeImagePSBT = (utxo, ordinal_p2tr, redeem, receiveAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const psbt = new Bitcoin.Psbt({ network });
    psbt.addInput({
        hash: utxo[0].txid,
        index: utxo[0].vout,
        tapInternalKey: (0, utils_service_1.toXOnly2)(wallet.ecPair.publicKey),
        witnessUtxo: { value: utxo[0].value, script: ordinal_p2tr.output },
        tapLeafScript: [
            {
                leafVersion: redeem.redeemVersion,
                script: redeem.output,
                controlBlock: ordinal_p2tr.witness[ordinal_p2tr.witness.length - 1],
            },
        ],
    });
    psbt.addOutput({
        address: receiveAddress,
        value: config_1.RUNE_RECEIVE_VALUE,
    });
    return psbt;
});
exports.inscribeImagePSBT = inscribeImagePSBT;
// Genreate Rune PSBT
const inscribeRunePSBT = (utxo, script_p2tr, etching_p2tr, redeem, receiveAddress, symbol, runeAmount, originalName, spacers) => __awaiter(void 0, void 0, void 0, function* () {
    const psbt = new Bitcoin.Psbt({ network });
    psbt.addInput({
        hash: utxo[0].txid,
        index: utxo[0].vout,
        witnessUtxo: { value: utxo[0].value, script: script_p2tr.output },
        tapLeafScript: [
            {
                leafVersion: redeem.redeemVersion,
                script: redeem.output,
                controlBlock: etching_p2tr.witness[etching_p2tr.witness.length - 1],
            },
        ],
    });
    const rune = runelib_1.Rune.fromName(originalName);
    const terms = new runelib_1.Terms(0, 0, new runelib_1.Range((0, runelib_1.none)(), (0, runelib_1.none)()), new runelib_1.Range((0, runelib_1.none)(), (0, runelib_1.none)()));
    const etching = new runelib_1.Etching((0, runelib_1.none)(), (0, runelib_1.some)(runeAmount), (0, runelib_1.some)(rune), (0, runelib_1.some)(spacers), (0, runelib_1.some)(symbol), (0, runelib_1.some)(terms), true);
    const stone = new runelib_1.Runestone([], (0, runelib_1.some)(etching), (0, runelib_1.none)(), (0, runelib_1.none)());
    psbt.addOutput({
        script: stone.encipher(),
        value: 0,
    });
    psbt.addOutput({
        address: receiveAddress,
        value: config_1.RUNE_RECEIVE_VALUE,
    });
    return psbt;
});
exports.inscribeRunePSBT = inscribeRunePSBT;
const finalizePsbtInput0 = (hexedPsbt) => __awaiter(void 0, void 0, void 0, function* () {
    const realPsbt = Bitcoin.Psbt.fromHex(hexedPsbt);
    realPsbt.signInput(0, wallet.ecPair);
    realPsbt.finalizeAllInputs();
    const tx = realPsbt.extractTransaction();
    return tx;
});
exports.finalizePsbtInput0 = finalizePsbtInput0;
// Broadcast PSBT
const broadcastPSBT = (psbt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tx = yield (0, exports.finalizePsbtInput0)(psbt);
        const txId = yield (0, exports.pushRawTx)(tx.toHex());
        console.log("Boradcast PSBT txid => ", txId);
        return txId;
    }
    catch (error) {
        console.log("Boradcast PSBT Error => ", error);
        throw error;
    }
});
exports.broadcastPSBT = broadcastPSBT;
// Get BTC UTXO
const waitUntilUTXO = (address) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        let intervalId;
        const checkForUtxo = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const response = yield blockstream.get(`/address/${address}/utxo`);
                const data = response.data
                    ? JSON.parse(response.data)
                    : undefined;
                if (data.length > 0) {
                    resolve(data);
                    clearInterval(intervalId);
                }
            }
            catch (error) {
                reject(error);
                clearInterval(intervalId);
            }
        });
        intervalId = setInterval(checkForUtxo, 5000);
    });
});
exports.waitUntilUTXO = waitUntilUTXO;
