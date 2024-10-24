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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const psbt_service_1 = require("../../service/psbt.service");
const config_1 = require("../../config/config");
// Create a new instance of the Express Router
const SendBtcRoute = (0, express_1.Router)();
// @route    GET api/users/username
// @desc     Is username available
// @access   Public
SendBtcRoute.post("/pre-exec", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("exec api is called!");
        const { buyerPayPubkey, buyerOrdinalAddress, buyerOrdinalPubkey, sellerPaymentAddress, amount, walletType, } = req.body;
        const { psbt, buyerPaymentsignIndexes } = yield (0, psbt_service_1.generateSendBTCPSBT)(walletType, buyerPayPubkey, buyerOrdinalAddress, buyerOrdinalPubkey, sellerPaymentAddress, amount);
        console.log("=========================>");
        console.log(JSON.stringify(psbt));
        return res.status(200).json({
            success: true,
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
            buyerPaymentsignIndexes,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
}));
SendBtcRoute.post("/exec", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("exec in sendBtcRoute ==>  api is calling!!");
    try {
        const { psbt, signedPSBT, walletType } = req.body;
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
            console.log("finalized psbt ==> ", tempPsbt2.extractTransaction(true));
            console.log("virtual size in exec ==> ", tempPsbt2.extractTransaction(true).virtualSize());
        }
        console.log("sellerSignPSBT ==> ", sellerSignPSBT);
        const txID = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log(txID);
        return res.status(200).json({ success: true, msg: txID });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
}));
SendBtcRoute.post("/rbf", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("req.body ==> ", req.body);
        const { txId, walletType, feeRate } = req.body;
        const { psbt, buyerPaymentsignIndexes } = yield (0, psbt_service_1.generateRBF_PSBT)(txId, walletType, feeRate);
        return res.status(200).json({
            success: true,
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
            buyerPaymentsignIndexes,
        });
        return res.json({});
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
}));
SendBtcRoute.post("/cancel", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("req.body ==> ", req.body);
        const { txId, walletType, feeRate } = req.body;
        const { psbt, buyerPaymentsignIndexes } = yield (0, psbt_service_1.cancel_Tx)(txId, walletType, feeRate);
        return res.status(200).json({
            success: true,
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
            buyerPaymentsignIndexes,
        });
        return res.json({});
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
}));
SendBtcRoute.post("/multisign-combine", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("exec api is calling!!");
    try {
        const { psbt, signedPSBT, walletType } = req.body;
        let sellerSignPSBT;
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
            sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), [0]);
        }
        else
            sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(signedPSBT, [0]);
        console.log("sellerSignPSBT ==> ", sellerSignPSBT);
        const txID = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log(txID);
        return res.status(200).json({ success: true, msg: txID });
    }
    catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
}));
exports.default = SendBtcRoute;
