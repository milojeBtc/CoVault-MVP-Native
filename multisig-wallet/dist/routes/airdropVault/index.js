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
const express_1 = require("express");
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const config_1 = require("../../config/config");
const rune_controller_1 = require("../../controller/rune.controller");
const airdropVault_controller_1 = require("../../controller/airdropVault.controller");
const AirdropVault_1 = __importDefault(require("../../model/AirdropVault"));
// Create a new instance of the Express Router
const airdropVaultRoute = (0, express_1.Router)();
// airdropVaultRoute.post("/create", async (req, res) => {
airdropVaultRoute.post("/create-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("create-vault api is called!!");
        console.log(req.body);
        const { pubKeyList, minSignCount, assets, creator, imageUrl } = req.body;
        let error = "";
        if (!imageUrl)
            error += "Image Url is required. ";
        if (!pubKeyList.length)
            error += "There is no publicKey value.";
        if (!minSignCount)
            error += "There is no minSignCount value.";
        if (minSignCount > pubKeyList.length)
            error += "minSignCount should be less than pubkey list count";
        if (error) {
            console.log("input error ==> ", error);
            return res.status(400).send({
                success: false,
                message: error,
                payload: null,
            });
        }
        // Create new vault.
        const payload = yield (0, airdropVault_controller_1.createNativeSegwitForAirdrop)(pubKeyList, minSignCount, creator, assets, config_1.TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin, imageUrl);
        console.log("payload after createNativeSegwit ==> ", payload);
        if (!payload.success)
            return res.status(200).send({
                success: payload.success,
                message: payload.message,
                payload: {
                    vault: null,
                    rune: null,
                },
            });
        console.log("Created new vault successfully!!");
        if (assets.runeName == "None")
            return res.status(200).send({
                success: payload.success,
                message: payload.message,
                payload: {
                    vault: payload,
                    rune: null,
                },
            });
        // Etching new rune tokens
        const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } = assets;
        const result = yield (0, rune_controller_1.createRuneToken)(runeName, runeAmount, runeSymbol, initialPrice, creatorAddress);
        console.log("Finished etching new rune toens ==> ", result);
        if (!result.success) {
            yield AirdropVault_1.default.findByIdAndDelete((_a = payload.payload) === null || _a === void 0 ? void 0 : _a.DBID);
            console.log("Remove new wallet cuz rune etching failed..");
            return res.status(200).send({
                success: result.success,
                message: result.message,
                payload: {
                    vault: payload,
                    rune: result,
                },
            });
        }
        return res.status(200).send({
            success: result.success,
            message: payload.message + " " + result.message,
            payload: {
                vault: payload,
                rune: result,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "There is Something wrong..",
            payload: null,
        });
    }
}));
airdropVaultRoute.get("/fetchAirdropList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("fetchAirdropList api is called!!");
        const walletList = yield AirdropVault_1.default.find();
        return res.status(200).send({
            success: true,
            message: "Fetch wallet list successfully",
            payload: walletList,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "There is Something wrong..",
            payload: null,
        });
    }
}));
airdropVaultRoute.post("/mintAirdrop", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey, walletId, } = req.body;
        console.log("mintAirdrop api is called!! ==> ", req.body);
        if (!paymentAddress ||
            !paymentPublicKey ||
            !ordinalAddress ||
            !ordinalPublicKey ||
            !walletId)
            return res.status(200).send({
                success: false,
                message: "one of input vault is missing..",
                payload: null,
            });
        const airdropVault = yield AirdropVault_1.default.findById(walletId);
        if (!airdropVault)
            return res.status(200).send({
                success: false,
                message: "No airdropVault with this id ",
                payload: null,
            });
        if (!airdropVault.assets)
            return res.status(200).send({
                success: false,
                message: "There is no assets in this airdrop vault",
                payload: null,
            });
        const { runeName, runeAmount, initialPrice, creatorAddress } = airdropVault.assets;
        const creator = airdropVault.creator;
        if (!creator)
            return res.status(200).send({
                success: false,
                message: "There is no creator address in DB",
                payload: null,
            });
        const result = yield (0, airdropVault_controller_1.runeMintController)(paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey, runeName, runeAmount, initialPrice, creator);
        console.log("result ==> ", result);
        return res.status(200).send(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
airdropVaultRoute.post("/broadcasting", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { psbt, signedPsbt, walletType, inputsCount, ordinalAddress, walletId, } = req.body;
        console.log("broadcasting ==> ", req.body);
        const txId = yield (0, airdropVault_controller_1.transfer)(psbt, signedPsbt, walletType, parseInt(inputsCount), ordinalAddress, walletId);
        return res.status(201).json(txId);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "There is some error",
            payload: error,
        });
    }
}));
airdropVaultRoute.post("/batchTransfer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { airdropId, unitAmount, runeId } = req.body;
        if (!airdropId || !unitAmount || !runeId)
            return res.status(200).send({
                success: false,
                message: "one of input vault is missing..",
                payload: null,
            });
        console.log("batchTransfer ==> ", req.body);
        const txId = yield (0, airdropVault_controller_1.batchTransfer)(airdropId, unitAmount, runeId);
        return res.status(201).json(txId);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "There is some error",
            payload: error,
        });
    }
}));
exports.default = airdropVaultRoute;
