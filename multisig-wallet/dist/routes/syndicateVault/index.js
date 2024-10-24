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
const syndicate_controller_1 = require("../../controller/syndicate.controller");
const SyndicateVault_1 = __importDefault(require("../../model/SyndicateVault"));
const SyndicateRequestModal_1 = __importDefault(require("../../model/SyndicateRequestModal"));
// Create a new instance of the Express Router
const syndicateVaultRoute = (0, express_1.Router)();
syndicateVaultRoute.post("/create-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const payload = yield (0, syndicate_controller_1.createSyndicateVault)(pubKeyList, minSignCount, creator, assets, config_1.TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin, imageUrl);
        console.log("payload after createSyndicateVault ==> ", payload);
        if (!payload.success)
            return res.status(200).send({
                success: payload.success,
                message: payload.message,
                payload: {
                    vault: null,
                    rune: null,
                },
            });
        console.log("Created new syndicate vault successfully!!");
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
            yield SyndicateVault_1.default.findByIdAndDelete((_a = payload.payload) === null || _a === void 0 ? void 0 : _a.DBID);
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
syndicateVaultRoute.get("/fetchSyndicateList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("fetchSyndicateList api is called!!!!");
        const walletList = yield SyndicateVault_1.default.find();
        return res.status(200).send({
            success: true,
            message: "fetchSyndicateList list successfully",
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
syndicateVaultRoute.post("/mint", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey, walletId, } = req.body;
        console.log("syndicate mint api is called!! ==> ", req.body);
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
        const syndicateVault = yield SyndicateVault_1.default.findById(walletId);
        if (!syndicateVault)
            return res.status(200).send({
                success: false,
                message: "No syndicate vault with this id ",
                payload: null,
            });
        if (!syndicateVault.assets)
            return res.status(200).send({
                success: false,
                message: "There is no assets in this syndicate vault",
                payload: null,
            });
        const { runeName, runeAmount, initialPrice, creatorAddress } = syndicateVault.assets;
        const creator = syndicateVault.creator;
        if (!creator)
            return res.status(200).send({
                success: false,
                message: "There is no creator address in DB",
                payload: null,
            });
        const result = yield (0, syndicate_controller_1.runeMintController)(paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey, runeName, runeAmount, initialPrice, creator);
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
syndicateVaultRoute.post("/broadcasting", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { psbt, signedPsbt, walletType, inputsCount, ordinalAddress, walletId, } = req.body;
        console.log("syndicate broadcasting ==> ", req.body);
        const txId = yield (0, syndicate_controller_1.transfer)(psbt, signedPsbt, walletType, parseInt(inputsCount), ordinalAddress, walletId);
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
syndicateVaultRoute.post("/batchTransfer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { airdropId, unitAmount, runeId, ordinalPublicKey } = req.body;
        if (!airdropId || !unitAmount || !runeId || !ordinalPublicKey)
            return res.status(200).send({
                success: false,
                message: "one of input vault is missing..",
                payload: null,
            });
        console.log("batchTransfer ==> ", req.body);
        const result = yield (0, syndicate_controller_1.batchTransfer)(airdropId, unitAmount, runeId, ordinalPublicKey);
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "There is some error",
            payload: error,
        });
    }
}));
syndicateVaultRoute.post("/updateRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { psbt, id, pubkey } = req.body;
        console.log("updateRequest for syndicate req.body ==>", req.body);
        if (!id || !pubkey || !psbt)
            return res.status(400).send({
                success: false,
                message: "Id, pubkey or psbt is missing.",
                payload: null,
            });
        const response = yield (0, syndicate_controller_1.updateRequestForSyndicate)(id, psbt, pubkey);
        console.log("response in updateRequest for syndicate ==> ", response);
        return res.status(200).send(response);
    }
    catch (error) {
        return {
            success: false,
            message: "Something error is happening.",
            payload: null,
        };
    }
}));
syndicateVaultRoute.get("/fetchSyndicateRequestList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("fetchSyndicateRequestList api is called!! ===>>>>>>>>>>>>>>>>> ");
        const walletList = yield SyndicateRequestModal_1.default.find();
        console.log("walletList ==> ", walletList[0]);
        return res.status(200).send({
            success: true,
            message: "fetchSyndicateRequestList list successfully",
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
syndicateVaultRoute.post("/getPsbtFromRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, pubkey } = req.body;
        console.log("Syndicate getPsbtFromRequest req.body ==>", req.body);
        if (!id || !pubkey)
            return res.status(400).send({
                success: false,
                message: "Id or pubkey is missing.",
                payload: null,
            });
        const response = yield (0, syndicate_controller_1.getPsbtFromSyndicateRequest)(id, pubkey);
        return res.status(200).send(response);
    }
    catch (error) {
        return {
            success: false,
            message: "Something error is happening.",
            payload: null,
        };
    }
}));
syndicateVaultRoute.post("/cancelUpdateForRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, pubkey } = req.body;
        console.log("cancelUpdateForSyndicateRequest req.body ==>", req.body);
        if (!id || !pubkey)
            return res.status(400).send({
                success: false,
                message: "Id or pubkey is missing.",
                payload: null,
            });
        const response = yield (0, syndicate_controller_1.cancelUpdateForSyndicateRequest)(id, pubkey);
        return res.status(200).send(response);
    }
    catch (error) { }
    return {
        success: false,
        message: "Something error is happening.",
        payload: null,
    };
}));
exports.default = syndicateVaultRoute;
