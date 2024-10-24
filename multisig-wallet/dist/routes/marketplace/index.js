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
const marketplace_controller_1 = require("../../controller/marketplace.controller");
const psbt_service_1 = require("../../service/psbt.service");
const marketplaceRoute = (0, express_1.Router)();
// @route    POST api/marketplace/list
// @desc     list rune edition position
// @access   Public
marketplaceRoute.post("/list", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("List api is called!!");
        const { sellerOrdinalAddress, sellerOrdinalPubkey, sellerPaymentAddress, sellerPaymentPubkey, runeTicker, sellPrice, imageUrl } = req.body;
        if (!sellerOrdinalAddress ||
            !sellerOrdinalPubkey ||
            !sellerPaymentAddress ||
            !sellerPaymentPubkey ||
            !runeTicker ||
            !imageUrl ||
            !sellPrice)
            return res.status(400).send({
                success: false,
                message: "one or more inputs is missing.",
                payload: null,
            });
        const runeId = yield (0, psbt_service_1.getRuneIdByName)(runeTicker);
        console.log("runeId ==> ", runeId);
        const result = yield (0, marketplace_controller_1.listController)(sellerOrdinalAddress, sellerOrdinalPubkey, sellerPaymentAddress, sellerPaymentPubkey, runeTicker, runeId, sellPrice, imageUrl);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    POST api/marketplace/pre_buyList
// @desc     get psbt for buying
// @access   Public
marketplaceRoute.post("/pre-buyList", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey, } = req.body;
        if (!buyerOrdinalAddress ||
            !buyerOrdinalPubkey ||
            !buyerPaymentAddress ||
            !buyerPaymentPubkey ||
            !listId)
            return res.status(400).send({
                success: false,
                message: "one or more inputs is missing.",
                payload: null,
            });
        const result = yield (0, marketplace_controller_1.pre_buyListController)(listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey);
        console.log("pre_buyList result ==> ", result);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    POST api/marketplace/buyList
// @desc     get psbt for buying
// @access   Public
marketplaceRoute.post("/ready-buyList", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey, psbt, inputsArray } = req.body;
        if (!buyerOrdinalAddress ||
            !buyerOrdinalPubkey ||
            !buyerPaymentAddress ||
            !buyerPaymentPubkey ||
            !listId ||
            !psbt ||
            !inputsArray)
            return res.status(400).send({
                success: false,
                message: "one or more inputs is missing.",
                payload: null,
            });
        const result = yield (0, marketplace_controller_1.ready_buyListController)(listId, buyerOrdinalAddress, buyerOrdinalPubkey, buyerPaymentAddress, buyerPaymentPubkey, psbt, inputsArray);
        console.log("ready_buyList result ==> ", result);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    GET api/marketplace/pre_buyList
// @desc     get psbt for buying
// @access   Public
marketplaceRoute.get("/fetchList", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, marketplace_controller_1.fetchController)();
        console.log("fetchList result ==> ", result);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    POST api/marketplace/cancleRequest
// @desc     get cancel reqeust
// @access   Public
marketplaceRoute.post("/cancelRequest", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("cancelRequest api is calling ==> ");
        const { marketplaceId, buyerOrdinalsAddress } = req.body;
        if (!marketplaceId)
            return res.status(200).json({
                success: false,
                message: "MarketplaceId is missing.",
                payload: null
            });
        if (!buyerOrdinalsAddress)
            return res.status(200).json({
                success: false,
                message: "buyerOrdinalsAddress is missing.",
                payload: null
            });
        const result = yield (0, marketplace_controller_1.cancelRequest)(marketplaceId, buyerOrdinalsAddress);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
// @route    POST api/marketplace/acceptRequest
// @desc     get cancel reqeust
// @access   Public
marketplaceRoute.post("/acceptRequest", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("acceptRequest api is calling!!");
    try {
        const { marketplaceId, sellerOrdinalAddress, psbt, signedPSBT, walletType } = req.body;
        if (!marketplaceId)
            return res.status(200).json({
                success: false,
                message: "MarketplaceId is missing.",
                payload: null
            });
        if (!sellerOrdinalAddress)
            return res.status(200).json({
                success: false,
                message: "sellerOrdinalAddress is missing.",
                payload: null
            });
        const result = yield (0, marketplace_controller_1.acceptRequestController)(marketplaceId, sellerOrdinalAddress, psbt, signedPSBT, walletType);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("acceptRequest Error : ", error);
        return res.status(500).json({ success: false });
    }
}));
exports.default = marketplaceRoute;
