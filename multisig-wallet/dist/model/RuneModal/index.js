"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const RuneSchema = new mongoose_1.default.Schema({
    txId: { type: String },
    sendBTCTxId: { type: String, required: true, unique: true },
    runeName: { type: String, required: true },
    runeSymbol: { type: String, required: true },
    initialPrice: { type: String, required: true },
    creatorAddress: { type: String, required: true },
    runeid: { type: String },
    runeAmount: { type: String, required: true },
    remainAmount: { type: String, required: true },
    psbt: { type: String, required: true },
    status: { type: String, required: true },
});
const RuneModel = mongoose_1.default.model("rune", RuneSchema);
exports.default = RuneModel;
