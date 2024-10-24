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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WIFWallet = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const ecc = __importStar(require("tiny-secp256k1"));
const ecpair_1 = require("ecpair");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
(0, bitcoinjs_lib_1.initEccLib)(ecc);
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
class WIFWallet {
    constructor(walletParam) {
        if (walletParam.networkType == "mainnet") {
            this.network = bitcoinjs_lib_1.networks.bitcoin;
        }
        else {
            this.network = bitcoinjs_lib_1.networks.testnet;
        }
        this.ecPair = ECPair.fromWIF(walletParam.privateKey, this.network);
        const { address, output } = bitcoin.payments.p2tr({
            internalPubkey: this.ecPair.publicKey.subarray(1, 33),
            network: this.network,
        });
        this.address = address;
        this.output = output;
        this.publicKey = this.ecPair.publicKey.toString("hex");
    }
    signPsbt(psbt, ecPair) {
        const tweakedChildNode = ecPair.tweak(bitcoin.crypto.taggedHash("TapTweak", ecPair.publicKey.subarray(1, 33)));
        for (let i = 0; i < psbt.inputCount; i++) {
            psbt.signInput(i, tweakedChildNode);
            psbt.validateSignaturesOfInput(i, () => true);
            psbt.finalizeInput(i);
        }
        return psbt;
    }
}
exports.WIFWallet = WIFWallet;
