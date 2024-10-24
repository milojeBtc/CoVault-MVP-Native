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
const stakingVaultRouter = (0, express_1.Router)();
stakingVaultRouter.post("/create-staking-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("create-staking-vault api is called!!");
        console.log(req.body);
        const { pubKey, assets, creator, imageUrl, stakableRuneId, rewardRuneId, rewardPerDay, rewardPerAmount, liveTime, claimableMinTime } = req.body;
        const stakingParams = {
            stakableRuneId,
            rewardRuneId,
            rewardPerDay,
            rewardPerAmount,
            liveTime,
            claimableMinTime
        };
        const minSignCount = 2;
        const pubKeyList = [];
        pubKeyList.push(pubKey);
        // Generate new 2 keypair
        let error = "";
        if (!imageUrl)
            error += "Image Url is required. ";
        if (!pubKey)
            error += "There is no publicKey value.";
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
exports.default = stakingVaultRouter;
