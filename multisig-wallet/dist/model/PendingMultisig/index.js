"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PendingMultisig = new mongoose_1.default.Schema({
    vaultName: { type: String, required: true },
    addressList: [{ type: String, required: true }],
    pubkeyList: [{ type: String }],
    threshold: { type: Number, required: true },
    vaultType: { type: String, required: true },
    assets: {
        runeName: { type: String, required: true },
        runeAmount: { type: String, required: true },
        initialPrice: { type: String, required: true },
        runeSymbol: { type: String, required: true },
        creatorAddress: { type: String, required: true },
    },
    imageUrl: { type: String, required: true },
    creator: {
        walletName: { type: String, required: true },
        ordinalsAddress: { type: String, required: true },
        ordinalsPubkey: { type: String, required: true },
        paymentAddress: { type: String, required: true },
        paymentPubkey: { type: String, required: true },
    },
    createdAt: { type: Date, default: new Date() },
    pending: { type: Boolean, default: true }
});
const PendingMultisigModal = mongoose_1.default.model("pendingMultisig", PendingMultisig);
exports.default = PendingMultisigModal;
