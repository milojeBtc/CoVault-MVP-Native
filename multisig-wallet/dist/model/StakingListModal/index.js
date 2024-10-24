"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StakingList = new mongoose_1.default.Schema({
    stakingVaultId: { type: String, required: true },
    stackerWallet: {
        paymentAddress: { type: String, required: true },
        paymentPublicKey: { type: String, required: true },
        ordinalAddress: { type: String, required: true },
        ordinalPublicKey: { type: String, required: true },
    },
    stakingHistory: [
        {
            stackingAmount: { type: Number, required: true },
            stackingTime: { type: Date, required: true },
        },
    ],
});
const StakingListModal = mongoose_1.default.model("stakingList", StakingList);
exports.default = StakingListModal;
