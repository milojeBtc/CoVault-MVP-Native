"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeeRate = exports.getTxStatus = exports.getBlockHeight = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const getBlockHeight = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${config_1.MEMPOOL_URL}/blocks/tip/height`;
        const res = yield axios_1.default.get(url);
        return Number(res.data);
    }
    catch (error) {
        console.log("Mempool API is not working for fetch block height");
        return -1;
    }
});
exports.getBlockHeight = getBlockHeight;
const getTxStatus = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${config_1.MEMPOOL_URL}/tx/${tx}/status`;
        const res = yield axios_1.default.get(url);
        return res.data;
    }
    catch (error) {
        // console.log("Get TX Status Failed", error);
        return false;
    }
});
exports.getTxStatus = getTxStatus;
const getFeeRate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${config_1.MEMPOOL_URL}/v1/fees/recommended`;
        const res = yield axios_1.default.get(url);
        return Math.round(Number(res.data.fastestFee) * 1.25);
    }
    catch (error) {
        // console.log("Ordinal api is not working now. Try again later");
        return 40;
    }
});
exports.getFeeRate = getFeeRate;
