"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Marketplace = new mongoose_1.default.Schema({
    parentAddress: { type: String, required: true },
    sellerInfo: {
        ordinalAddress: { type: String, required: true },
        ordinalPublicKey: { type: String, required: true },
        paymentAddress: { type: String, required: true },
        paymentPublicKey: { type: String, required: true }
    },
    buyerInfo: {
        ordinalAddress: { type: String },
        ordinalPublicKey: { type: String },
        paymentAddress: { type: String },
        paymentPublicKey: { type: String }
    },
    runeTicker: { type: String, required: true },
    runeId: { type: String, required: true },
    sellPrice: { type: String, required: true },
    psbt: { type: String },
    inputsArray: [{ type: Number }],
    status: { type: String, required: true },
    imageUrl: { type: String },
    createdAt: { type: Date, default: new Date() }
});
const MarketplaceModal = mongoose_1.default.model("marketplace", Marketplace);
exports.default = MarketplaceModal;
