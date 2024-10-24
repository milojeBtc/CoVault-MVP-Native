"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AirdropVault = new mongoose_1.default.Schema({
    cosigner: [{ type: String, required: true }],
    witnessScript: { type: String, required: true },
    p2msOutput: { type: String, required: true },
    address: { type: String, required: true },
    threshold: { type: Number, required: true },
    creator: {
        paymentAddress: { type: String, required: true },
        paymentPublicKey: { type: String, required: true },
        ordinalAddress: { type: String, required: true },
        ordinalPublicKey: { type: String, required: true },
    },
    assets: {
        runeName: { type: String, required: true },
        runeAmount: { type: String, required: true },
        initialPrice: { type: String, required: true },
        runeSymbol: { type: String, required: true },
        creatorAddress: { type: String, required: true },
    },
    edition: [{ type: String }],
    createdAt: { type: Date, default: new Date() },
    imageUrl: { type: String }
});
const AirdropVaultModal = mongoose_1.default.model("airdropVault", AirdropVault);
exports.default = AirdropVaultModal;
