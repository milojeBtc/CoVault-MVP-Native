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
const runeRoute = (0, express_1.Router)();
// @route    GET api/rune/etch-token
// @desc     etch rune token
// @access   Public
runeRoute.post("/etch-token", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } = req.body;
        const result = yield (0, rune_controller_1.createRuneToken)(runeName, runeAmount, runeSymbol, initialPrice, creatorAddress);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    GET api/rune/tx-check
// @desc     rune transaction check in cycle timeline
// @access   Public
runeRoute.get("/tx-check", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).send(yield (0, rune_controller_1.checkTxStatus)());
    }
    catch (error) {
        return res.status(200).send('Tx check failed');
    }
}));
exports.default = runeRoute;
