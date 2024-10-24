"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const TempTaprootMultisig = new mongoose_1.default.Schema({
    cosigner: [
        { type: String, required: true }
    ],
    threshold: { type: Number, required: true },
    privateKey: { type: String, required: true },
    tapscript: { type: String, required: true },
    address: { type: String, required: true },
    assets: {
        runeName: { type: String, required: true },
        runeAmount: { type: String, required: true },
        initialPrice: { type: String, required: true },
        runeSymbol: { type: String, required: true },
        creatorAddress: { type: String, required: true }
    },
    imageUrl: { type: String },
    createdAt: { type: Date, default: new Date() },
});
const TempTaprootMultisigModal = mongoose_1.default.model("TempTaprootmultisig", TempTaprootMultisig);
exports.default = TempTaprootMultisigModal;
