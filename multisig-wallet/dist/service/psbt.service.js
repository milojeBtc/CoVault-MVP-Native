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
exports.getRuneIdByName = exports.finalizePsbtInput = exports.pushRawTx = exports.combinePsbt = exports.cancel_Tx = exports.generateRBF_PSBT = exports.generateSendBTCPSBT = exports.generateSendOrdinalPSBT = exports.transferAllAssetsFeeCalc = exports.calculateTxFee_v2 = exports.calculateTxFee = exports.getFeeRate = exports.getAllRuneIdList = exports.getBtcUtxoByAddress = exports.getRuneUtxoByAddress = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
Bitcoin.initEccLib(ecc);
const network = config_1.TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin;
const RBF_INPUT_SEQUENCE = 0xfffffffd;
const RBF_INPUT_SEQUENCE2 = 0xfffffffe;
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
const getRuneUtxoByAddress = (address, runeId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/${runeId}/utxo`;
    console.log("url===========>", url);
    const config = {
        headers: {
            Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
        },
    };
    let cursor = 0;
    let tokenSum = 0;
    const size = 5000;
    const utxos = [];
    const res = yield axios_1.default.get(url, Object.assign(Object.assign({}, config), { params: { cursor, size } }));
    if (res.data.code === -1)
        throw "Invalid Address";
    console.log("res.data.data ==> ", res.data.data);
    utxos.push(...res.data.data.utxo.map((utxo) => {
        tokenSum += Number(utxo.runes[0].amount);
        return {
            scriptpubkey: utxo.scriptPk,
            txid: utxo.txid,
            value: utxo.satoshi,
            vout: utxo.vout,
            amount: Number(utxo.runes[0].amount),
            divisibility: utxo.runes[0].divisibility,
        };
    }));
    cursor += res.data.data.utxo.length;
    return { runeUtxos: utxos, tokenSum };
});
exports.getRuneUtxoByAddress = getRuneUtxoByAddress;
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
    // while (1) {
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
    // cursor += res.data.data.utxo.length;
    // if (cursor === res.data.data.total) break;
    // }
    return utxos;
});
exports.getBtcUtxoByAddress = getBtcUtxoByAddress;
const getAllRuneIdList = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/balance-list?start=0&limit=500`;
    const config = {
        headers: {
            Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
        },
    };
    const runeIdList = [];
    const res = yield axios_1.default.get(url, config);
    if (res.data.code === -1)
        throw "Invalid Address";
    runeIdList.push(...res.data.data.detail.map((runeList) => runeList.runeid));
    return runeIdList;
});
exports.getAllRuneIdList = getAllRuneIdList;
// Get Current Network Fee
const getFeeRate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/v1/fees/recommended`;
        const res = yield axios_1.default.get(url);
        return Math.round(res.data.fastestFee * 1.5);
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return 300;
    }
});
exports.getFeeRate = getFeeRate;
// Get Current Network Fee
const getUTXObyId = (txId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("delay start ==> ");
        yield delay(1000);
        console.log("delay end ==> ");
        const url = `https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx/${txId}`;
        console.log("url ==> ", url);
        const res = yield axios_1.default.get(url);
        console.log("res ==> ", res.data);
        return {
            success: true,
            payload: res.data,
        };
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return {
            success: false,
            payload: null,
        };
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
    return Math.floor((tx.virtualSize() * feeRate));
};
exports.calculateTxFee = calculateTxFee;
// Calc Tx Fee
const calculateTxFee_v2 = (psbt, feeRate) => {
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
    return Math.floor((tx.virtualSize() * feeRate));
};
exports.calculateTxFee_v2 = calculateTxFee_v2;
// Calc Tx Fee
const transferAllAssetsFeeCalc = (psbt, feeRate, thresHoldValue) => {
    const tx = new Bitcoin.Transaction();
    console.log("psbt.txInputs ==> ", psbt.txInputs);
    for (let i = 0; i < psbt.txInputs.length; i++) {
        const txInput = psbt.txInputs[i];
        tx.addInput(txInput.hash, txInput.index, txInput.sequence);
        tx.setWitness(i, [Buffer.alloc(config_1.SIGNATURE_SIZE)]);
    }
    console.log("psbt.txOutputs ==> ", psbt.txOutputs);
    for (let txOutput of psbt.txOutputs) {
        tx.addOutput(txOutput.script, txOutput.value);
    }
    tx.addOutput(psbt.txOutputs[0].script, psbt.txOutputs[0].value);
    console.log("tx virtial size ==> ", tx.virtualSize() + config_1.COSIGNATURE_SIZE * thresHoldValue);
    return Math.floor((tx.virtualSize() + config_1.COSIGNATURE_SIZE * thresHoldValue) * feeRate);
};
exports.transferAllAssetsFeeCalc = transferAllAssetsFeeCalc;
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
    const btcUtxos = yield (0, exports.getBtcUtxoByAddress)(paymentAddress);
    const feeRate = yield (0, exports.getFeeRate)();
    let amount = 0;
    const buyerPaymentsignIndexes = [];
    for (const utxo of btcUtxos) {
        const fee = (0, exports.calculateTxFee)(psbt, feeRate);
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
    const fee = (0, exports.calculateTxFee)(psbt, feeRate);
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
    const btcUtxos = yield (0, exports.getBtcUtxoByAddress)(paymentAddress);
    // const feeRate = await getFeeRate();
    const feeRate = 250;
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
                    sequence: RBF_INPUT_SEQUENCE,
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
                    sequence: RBF_INPUT_SEQUENCE,
                });
            }
            else if (walletType === config_2.WalletTypes.XVERSE) {
                const txHex = yield getTxHexById(utxo.txid);
                console.log("paymentoutput ==> ", paymentoutput);
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    redeemScript: paymentoutput,
                    nonWitnessUtxo: Buffer.from(txHex, "hex"),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                    sequence: RBF_INPUT_SEQUENCE,
                });
            }
        }
    }
    console.log("Get Utxo from addresses.");
    if (price > 0) {
        psbt.addOutput({
            address: sellerPaymentAddress,
            value: parseInt((((price * (100 - 0)) / 100) * Math.pow(10, 8)).toString()),
        });
        // psbt.addOutput({
        //   address: ADMIN_PAYMENT_ADDRESS,
        //   value: parseInt(
        //     (((price * SERVICE_FEE_PERCENT) / 100) * 10 ** 8).toString()
        //   ),
        // });
    }
    console.log("price");
    const fee = (0, exports.calculateTxFee)(psbt, feeRate);
    console.log("fee ==> ", fee);
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
// Generate Send BTC PSBT
const generateRBF_PSBT = (txId, walletType, feeRate) => __awaiter(void 0, void 0, void 0, function* () {
    const psbt = new Bitcoin.Psbt({ network: network });
    const utxo = [];
    while (1) {
        const tempUtxo = yield getUTXObyId(txId);
        if (tempUtxo.success == true) {
            console.log("tempUtxo ==> ", tempUtxo);
            utxo.push(tempUtxo.payload);
            break;
        }
        else
            console.log("Network is not working well, try again to fetch UTXO data");
    }
    console.log("result ==> ", utxo[0]);
    console.log("vin ==> ", utxo[0].vin);
    console.log("vout ==> ", utxo[0].vout);
    const { vin, vout } = utxo[0];
    const buyerPaymentsignIndexes = [];
    const senderAddress = vin[0].prevout.scriptpubkey_address;
    const totalAmount = vin[0].prevout.value;
    for (const oneUtxo of vin) {
        buyerPaymentsignIndexes.push(psbt.inputCount);
        if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
            psbt.addInput({
                hash: oneUtxo.txid,
                index: oneUtxo.vout,
                witnessUtxo: {
                    value: oneUtxo.prevout.value,
                    script: Buffer.from(oneUtxo.prevout.scriptpubkey, "hex"),
                },
                // tapInternalKey:
                //   walletType === WalletTypes.OKX
                //     ? Buffer.from(buyerOrdinalPubkey, "hex")
                //     : Buffer.from(buyerOrdinalPubkey, "hex").slice(1, 33),
                sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                sequence: RBF_INPUT_SEQUENCE2,
            });
        }
        // else if (walletType === WalletTypes.HIRO) {
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     witnessUtxo: {
        //       value: oneUtxo.value,
        //       script: Buffer.from(oneUtxo.scriptpubkey as string, "hex"),
        //     },
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // } else if (walletType === WalletTypes.XVERSE) {
        //   const txHex = await getTxHexById(oneUtxo.txid);
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     redeemScript: paymentoutput,
        //     nonWitnessUtxo: Buffer.from(txHex, "hex"),
        //     sighashType: Bitcoin.Transaction.SIGHASH_ALL,
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // }
    }
    for (const oneUtxo of vout) {
        if (oneUtxo.scriptpubkey_address != senderAddress)
            psbt.addOutput({
                address: oneUtxo.scriptpubkey_address,
                value: oneUtxo.value,
            });
    }
    const fee = (0, exports.calculateTxFee)(psbt, feeRate);
    // console.log('fee ==> ', fee);
    psbt.addOutput({
        address: senderAddress,
        value: totalAmount - fee,
    });
    console.log(psbt.toBase64());
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
});
exports.generateRBF_PSBT = generateRBF_PSBT;
// Generate Send BTC PSBT
const cancel_Tx = (txId, walletType, feeRate) => __awaiter(void 0, void 0, void 0, function* () {
    const psbt = new Bitcoin.Psbt({ network: network });
    const utxo = [];
    while (1) {
        const tempUtxo = yield getUTXObyId(txId);
        if (tempUtxo.success == true) {
            console.log("tempUtxo ==> ", tempUtxo);
            utxo.push(tempUtxo.payload);
            break;
        }
        else
            console.log("Network is not working well, try again to fetch UTXO data");
    }
    console.log("result ==> ", utxo[0]);
    console.log("vin ==> ", utxo[0].vin);
    console.log("vout ==> ", utxo[0].vout);
    const { vin, vout } = utxo[0];
    const buyerPaymentsignIndexes = [];
    const senderAddress = vin[0].prevout.scriptpubkey_address;
    const totalAmount = vin[0].prevout.value;
    for (const oneUtxo of vin) {
        buyerPaymentsignIndexes.push(psbt.inputCount);
        if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
            psbt.addInput({
                hash: oneUtxo.txid,
                index: oneUtxo.vout,
                witnessUtxo: {
                    value: oneUtxo.prevout.value,
                    script: Buffer.from(oneUtxo.prevout.scriptpubkey, "hex"),
                },
                // tapInternalKey:
                //   walletType === WalletTypes.OKX
                //     ? Buffer.from(buyerOrdinalPubkey, "hex")
                //     : Buffer.from(buyerOrdinalPubkey, "hex").slice(1, 33),
                sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                sequence: RBF_INPUT_SEQUENCE2,
            });
        }
    }
    for (const oneUtxo of vout) {
        if (oneUtxo.scriptpubkey_address != senderAddress)
            psbt.addOutput({
                address: "tb1p9f7vuvrvvw505g9nqrqaw707tdcngxn79w5mwr5395n2mvx4g38ssjeh4y",
                value: oneUtxo.value,
            });
    }
    const fee = (0, exports.calculateTxFee)(psbt, feeRate);
    // console.log('fee ==> ', fee);
    psbt.addOutput({
        address: senderAddress,
        value: totalAmount - fee,
    });
    console.log(psbt.toBase64());
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
});
exports.cancel_Tx = cancel_Tx;
const combinePsbt = (hexedPsbt, signedHexedPsbt1, signedHexedPsbt2) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("combinePsbt ==> ");
        const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
        const signedPsbt1 = Bitcoin.Psbt.fromHex(signedHexedPsbt1);
        if (signedHexedPsbt2) {
            const signedPsbt2 = Bitcoin.Psbt.fromHex(signedHexedPsbt2);
            psbt.combine(signedPsbt1, signedPsbt2);
        }
        else {
            psbt.combine(signedPsbt1);
        }
        console.log("combine is finished!!");
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();
        console.log("virtial Size of transaction ==> ", tx.virtualSize());
        console.log("txHex =======> ", txHex);
        const txId = yield (0, exports.pushRawTx)(txHex);
        console.log("txId ==> ", txId);
        return txId;
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.combinePsbt = combinePsbt;
const pushRawTx = (rawTx) => __awaiter(void 0, void 0, void 0, function* () {
    const txid = yield postData(`https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx`, rawTx);
    // const txid = "test";
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
const getRuneIdByName = (runeName) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/runes/${runeName}/info`;
    const config = {
        headers: {
            Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
        },
    };
    const result = yield axios_1.default.get(url, config);
    const data = result.data.data;
    if (data) {
        return data.runeid;
    }
    else {
        null;
    }
});
exports.getRuneIdByName = getRuneIdByName;
