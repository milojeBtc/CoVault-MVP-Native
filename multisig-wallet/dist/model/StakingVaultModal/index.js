"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StakingVault = new mongoose_1.default.Schema({
    serverKeys: [{ type: String, required: true }],
    deployer: {
        paymentAddress: { type: String, required: true },
        paymentPublicKey: { type: String, required: true },
        ordinalAddress: { type: String, required: true },
        ordinalPublicKey: { type: String, required: true },
    },
    cosigner: [{ type: String, required: true }],
    witnessScript: { type: String, required: true },
    p2msOutput: { type: String, required: true },
    address: { type: String, required: true },
    threshold: { type: Number, required: true },
    createdAt: { type: Date, default: new Date() },
    imageUrl: { type: String },
    stakingParams: {
        stakableRuneId: { type: String, required: true },
        rewardRuneId: { type: String, required: true },
        rewardPerDay: { type: String, required: true },
        rewardPerAmount: { type: String, required: true },
        liveTime: { type: String, required: true },
        claimableMinTime: { type: String, required: true },
    },
});
const StakingVaultModal = mongoose_1.default.model("stakingVault", StakingVault);
exports.default = StakingVaultModal;
