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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rune_controller_1 = require("../../controller/rune.controller");
const psbt_service_1 = require("../../utils/psbt.service");
const test1_1 = require("../../controller/test1");
const testRoute = (0, express_1.Router)();
// @route    GET api/users/username
// @desc     Is username available
// @access   Public
testRoute.post("/broadcasting", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { psbt } = req.body;
        const result = yield (0, psbt_service_1.broadcastPSBT)(psbt);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
testRoute.post("/etch-token", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } = req.body;
        const result = yield (0, rune_controller_1.createRuneToken)(runeName, runeAmount, runeSymbol, initialPrice, creatorAddress);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
testRoute.get("/create-ordinal-test-wallet", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, test1_1.createMultiSigWallet)();
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
testRoute.get("/send-ordinal", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, test1_1.sendOrdinal)();
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
testRoute.get("/send-ordinal-ns", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, test1_1.sendOrdinalNS)();
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = testRoute;
