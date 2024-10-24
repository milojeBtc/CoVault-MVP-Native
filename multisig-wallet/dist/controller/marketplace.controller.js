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
exports.acceptRequestController = exports.cancelRequest = exports.fetchController = exports.ready_buyListController = exports.pre_buyListController = exports.getAllListController = exports.listController = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
const config_1 = require("../config/config");
const localWallet_1 = require("../utils/localWallet");
const MarketPlace_1 = __importDefault(require("../model/MarketPlace"));
const type_1 = require("../type");
const AirdropVault_1 = __importDefault(require("../model/AirdropVault"));
const unisat_service_1 = require("../service/unisat.service");
const psbt_service_1 = require("../service/psbt.service");
Bitcoin.initEccLib(ecc);
const network = config_1.TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin;
const wallet = new localWallet_1.LocalWallet(config_1.WIF_KEY, config_1.TEST_MODE ? 1 : 0);
const listController = (sellerOrdinalAddress, sellerOrdinalPubkey, sellerPaymentAddress, sellerPaymentPubkey, runeTicker, runeId, sellPrice, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // valid in airdropList
        const airdropList = yield AirdropVault_1.default.find();
        const runeAssetsNameList = airdropList.map((airdrop) => { var _a; return (_a = airdrop.assets) === null || _a === void 0 ? void 0 : _a.runeName.replaceAll(".", "").toLocaleUpperCase(); });
        console.log("runeAssetsNameList ==> ", runeAssetsNameList);
        if (!runeAssetsNameList)
            return;
        const runeInfo = yield (0, unisat_service_1.getRuneInfo)(runeId);
        if (!runeInfo)
            return {
                success: false,
                message: "Rune ID is invalid.",
                payload: null,
            };
        const RunePureName = runeInfo === null || runeInfo === void 0 ? void 0 : runeInfo.replaceAll("•", "");
        const findIndex = runeAssetsNameList.findIndex((list) => list == RunePureName);
        // if (!runeAssetsNameList.includes(RunePureName))
        if (findIndex < 0)
            return {
                success: false,
                message: "This rune is not allowed for airdrop edition position",
                payload: null,
            };
        const parentAddress = airdropList[findIndex].address;
        // Verify Repeatance
        const existOne = yield MarketPlace_1.default.findOne({
            parentAddress,
            sellerInfo: {
                ordinalAddress: sellerOrdinalAddress,
                ordinalPublicKey: sellerOrdinalPubkey,
                paymentAddress: sellerPaymentAddress,
                paymentPublicKey: sellerPaymentPubkey,
            },
            runeId,
        });
        if (existOne)
            return {
                success: false,
                message: "You already request with this.",
                payload: null,
            };
        const newList = new MarketPlace_1.default({
            parentAddress,
            sellerInfo: {
                ordinalAddress: sellerOrdinalAddress,
                ordinalPublicKey: sellerOrdinalPubkey,
                paymentAddress: sellerPaymentAddress,
                paymentPublicKey: sellerPaymentPubkey,
            },
            runeTicker,
            runeId,
            sellPrice,
            psbt: "",
            imageUrl,
            status: type_1.Status.Pending,
        });
        yield newList.save();
        return {
            success: true,
            message: "Your request submitted successfully.",
            payload: newList,
        };
    }
    catch (error) {
        console.log("Marketplace list error ==> ", error);
        return {
            success: false,
            message: "Unexpected errors is happened.",
            payload: error,
        };
    }
});
exports.listController = listController;
const getAllListController = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allList = yield MarketPlace_1.default.find();
        if (!allList.length)
            return {
                success: false,
                message: "There is no list in DB",
                payload: null,
            };
        return {
            success: true,
            message: "Fetching list successfully.",
            payload: allList,
        };
    }
    catch (error) {
        console.log("Error in fetching List from DB ==> ", error);
        return {
            success: false,
            message: "Unexpected fetching error..",
            payload: error,
        };
    }
});
exports.getAllListController = getAllListController;
const pre_buyListController = (listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marketplaceInfo = yield MarketPlace_1.default.findById(listId);
        const status = marketplaceInfo === null || marketplaceInfo === void 0 ? void 0 : marketplaceInfo.status;
        if (status != type_1.Status.Pending)
            return {
                success: false,
                message: "This request is already accepted by another buyer.",
                payload: null,
            };
        const sellerInfo = marketplaceInfo === null || marketplaceInfo === void 0 ? void 0 : marketplaceInfo.sellerInfo;
        const runeId = marketplaceInfo === null || marketplaceInfo === void 0 ? void 0 : marketplaceInfo.runeId;
        if (!sellerInfo || !runeId)
            return {
                success: false,
                message: "sellerInfo or runeId not found in DB",
                payload: null,
            };
        const sellerInputs = []; // rune
        const buyerInputs = []; // btc
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(buyerPaymentAddress);
        const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(sellerInfo === null || sellerInfo === void 0 ? void 0 : sellerInfo.ordinalAddress, runeId);
        console.log("runeUtxos ==> ", runeUtxos);
        console.log("btcUtxos ==> ", btcUtxos);
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        const psbt = new Bitcoin.Psbt({ network });
        for (const runeutxo of runeUtxos.runeUtxos) {
            if (runeutxo.amount == 1) {
                sellerInputs.push(psbt.inputCount);
                psbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    witnessUtxo: {
                        value: runeutxo.value,
                        script: Buffer.from(runeutxo.scriptpubkey, "hex"),
                    },
                    tapInternalKey: Buffer.from(sellerInfo.ordinalPublicKey, "hex").slice(1, 33),
                });
                break;
            }
        }
        psbt.addOutput({
            address: buyerOrdinalAddress,
            value: 546,
        });
        psbt.addOutput({
            address: sellerInfo.paymentAddress,
            value: parseInt(marketplaceInfo.sellPrice),
        });
        let totalBtcAmount = 0;
        let price = parseInt(marketplaceInfo.sellPrice);
        for (const btcutxo of btcUtxos) {
            const fee = (0, psbt_service_1.calculateTxFee_v2)(psbt, feeRate);
            if (totalBtcAmount < fee + price && btcutxo.value > 10000) {
                totalBtcAmount += btcutxo.value;
                buyerInputs.push(psbt.inputCount);
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    tapInternalKey: Buffer.from(buyerPaymentPubkey, "hex").slice(1, 33),
                    witnessUtxo: {
                        script: Buffer.from(btcutxo.scriptpubkey, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        const fee = (0, psbt_service_1.calculateTxFee_v2)(psbt, feeRate);
        console.log("Pay Fee =====================>", fee);
        console.log("totalBtcAmount ====>", totalBtcAmount);
        if (totalBtcAmount < fee + price)
            return {
                success: false,
                message: "BTC balance is not enough.",
                payload: null,
            };
        psbt.addOutput({
            address: buyerPaymentAddress,
            value: totalBtcAmount - fee - price,
        });
        console.log("final PSBT ==> ");
        console.log(psbt);
        console.log(JSON.stringify(psbt));
        return {
            success: true,
            message: "Generating PSBT successfully.",
            payload: {
                hex: psbt.toHex(),
                base64: psbt.toBase64(),
                buyerInputs,
                sellerInputs,
            },
        };
    }
    catch (error) {
        console.log("error in pre_buyListController ==> ", error);
        return {
            success: false,
            message: "Unexpected error is happened.",
            payload: null,
        };
    }
});
exports.pre_buyListController = pre_buyListController;
const ready_buyListController = (listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey, psbt, inputsArray) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marketplaceInfo = yield MarketPlace_1.default.findById(listId);
        if (!marketplaceInfo)
            return {
                success: false,
                message: "There is no marketplace with this id.",
                payload: null,
            };
        const status = marketplaceInfo === null || marketplaceInfo === void 0 ? void 0 : marketplaceInfo.status;
        if (status != type_1.Status.Pending)
            return {
                success: false,
                message: "This request is already accepted by another buyer.",
                payload: null,
            };
        marketplaceInfo.psbt = psbt;
        marketplaceInfo.buyerInfo = {
            ordinalAddress: buyerOrdinalAddress,
            ordinalPublicKey: buyerOrdinalPubkey,
            paymentAddress: buyerPaymentAddress,
            paymentPublicKey: buyerPaymentPubkey,
        };
        marketplaceInfo.inputsArray = inputsArray;
        marketplaceInfo.status = type_1.Status.Ready;
        yield marketplaceInfo.save();
        return {
            success: true,
            message: "Generating PSBT successfully.",
            payload: marketplaceInfo,
        };
    }
    catch (error) {
        console.log("error in pre_buyListController ==> ", error);
        return {
            success: false,
            message: "Unexpected error is happened.",
            payload: null,
        };
    }
});
exports.ready_buyListController = ready_buyListController;
const fetchController = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const marketPlaceList = yield MarketPlace_1.default.find();
        return {
            success: true,
            payload: marketPlaceList,
            message: "Fetching list successfully",
        };
    }
    catch (error) {
        console.log("error ==> ", error);
        return {
            success: false,
            payload: [],
            message: "Get Unexpected error in fetching list.",
        };
    }
});
exports.fetchController = fetchController;
const cancelRequest = (marketplaceId, buyerOrdinalsAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const marketplaceData = yield MarketPlace_1.default.findById(marketplaceId);
        if (!marketplaceData)
            return {
                success: false,
                message: "There is no marketplace vault with this id.",
                payload: null,
            };
        if (marketplaceData.status != "Ready")
            return {
                success: false,
                message: "You didn't sign this request before.",
                payload: null,
            };
        if (((_a = marketplaceData.buyerInfo) === null || _a === void 0 ? void 0 : _a.ordinalAddress) != buyerOrdinalsAddress)
            return {
                success: false,
                message: "Another wallet is signed in this request.",
                payload: null,
            };
        marketplaceData.buyerInfo = null;
        marketplaceData.psbt = "";
        marketplaceData.inputsArray = [];
        marketplaceData.status = "Pending";
        console.log("marketplaceData ==> ", marketplaceData);
        yield marketplaceData.save();
        return {
            success: true,
            message: "MarketPlace request is canceled successfully.",
            payload: marketplaceData,
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Get unexpected error while cancel marketplace request.",
            payload: null,
        };
    }
});
exports.cancelRequest = cancelRequest;
const acceptRequestController = (marketplaceId, sellerOrdinalAddress, psbt, signedPSBT, walletType) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const marketplaceData = yield MarketPlace_1.default.findById(marketplaceId);
        if (!marketplaceData)
            return {
                success: false,
                message: "There is no marketplace vault with this id.",
                payload: null,
            };
        if (marketplaceData.status != "Ready")
            return {
                success: false,
                message: "This is not ready for accept.",
                payload: null,
            };
        if (((_b = marketplaceData.sellerInfo) === null || _b === void 0 ? void 0 : _b.ordinalAddress) != sellerOrdinalAddress)
            return {
                success: false,
                message: "You are not seller address in this request",
                payload: null,
            };
        const tempPsbt = Bitcoin.Psbt.fromHex(signedPSBT);
        const inputCount = tempPsbt.inputCount;
        const inputArr = Array.from({ length: inputCount }, (_, index) => index);
        console.log("inputArr in exec ==> ", inputArr);
        let sellerSignPSBT;
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
            sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), inputArr);
        }
        else if (walletType === config_1.WalletTypes.HIRO) {
            sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(signedPSBT, inputArr);
        }
        else {
            // sellerSignPSBT = signedPSBT;
            sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(signedPSBT, inputArr);
            const tempPsbt2 = Bitcoin.Psbt.fromHex(sellerSignPSBT);
            console.log("virtual size in exec ==> ", tempPsbt2.extractTransaction(true).virtualSize());
            console.log("feeRate ==> ", (yield (0, psbt_service_1.getFeeRate)()) + 1);
        }
        console.log("sellerSignPSBT ==> ", sellerSignPSBT);
        const txID = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log("txID ==> ", txID);
        if (!txID)
            return {
                success: false,
                message: "Transaction broadcasting failed.",
                payload: null,
            };
        marketplaceData.status = type_1.Status.End;
        console.log("marketplaceData ==> ", marketplaceData);
        yield marketplaceData.save();
        return {
            success: true,
            message: "MarketPlace request is accepted successfully.",
            payload: txID,
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Get unexpected error while cancel marketplace request.",
            payload: null,
        };
    }
});
exports.acceptRequestController = acceptRequestController;
