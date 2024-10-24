"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const SyndicateRequestSchema = new mongoose_1.default.Schema({
    type: { type: String, required: true },
    vaultAddress: { type: String, required: true },
    runeId: { type: String, required: true },
    transferAmount: { type: String },
    editions: [{ type: String, required: true }],
    creator: { type: String, required: true },
    cosigner: [{ type: String, required: true }],
    signedCosigner: [{ type: String, required: true }],
    psbt: [{ type: String, required: true }],
    threshold: { type: Number, required: true },
    assets: {
        runeName: { type: String, required: true },
        runeAmount: { type: String, required: true },
        initialPrice: { type: String, required: true },
        runeSymbol: { type: String, required: true },
        creatorAddress: { type: String, required: true },
    },
    pending: { type: String },
    createdAt: { type: Date, default: new Date() },
});
const SyndicateRequestModal = mongoose_1.default.model("SyndicateRequestModal", SyndicateRequestSchema);
exports.default = SyndicateRequestModal;
