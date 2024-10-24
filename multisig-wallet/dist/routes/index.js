"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRoute = exports.runeRoute = exports.multiSigWalletRoute = exports.SendBtcRoute = void 0;
const sendBtcRoute_1 = __importDefault(require("./sendBtcRoute"));
exports.SendBtcRoute = sendBtcRoute_1.default;
const multisig_1 = __importDefault(require("./multisig"));
exports.multiSigWalletRoute = multisig_1.default;
const rune_1 = __importDefault(require("./rune"));
exports.runeRoute = rune_1.default;
const test_1 = __importDefault(require("./test"));
exports.testRoute = test_1.default;
