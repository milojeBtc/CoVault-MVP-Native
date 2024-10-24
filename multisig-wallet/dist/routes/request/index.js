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
const express_1 = require("express");
const RequestModal_1 = __importDefault(require("../../model/RequestModal"));
const request_controller_1 = require("../../controller/request.controller");
const psbt_service_1 = require("../../service/psbt.service");
// Create a new instance of the Express Router
const requestRouter = (0, express_1.Router)();
requestRouter.get("/getAllRequestList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allList = yield (0, request_controller_1.getAllRequestList)();
    return res.status(200).send({
        success: true,
        message: (allList === null || allList === void 0 ? void 0 : allList.length)
            ? "Fetch all request successfully. "
            : "No request found.",
        payload: allList,
    });
}));
requestRouter.post("/getOneRequestList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.body;
    const list = yield (0, request_controller_1.getOneRequestList)(requestId);
    return res.status(200).send({
        success: true,
        message: list ? "Fetch request successfully. " : "Not found.",
        payload: list,
    });
}));
requestRouter.post("/getPsbtFromRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, pubkey } = req.body;
        console.log("getPsbtFromRequest req.body ==>", req.body);
        if (!id || !pubkey)
            return res.status(400).send({
                success: false,
                message: "Id or pubkey is missing.",
                payload: null,
            });
        const response = yield (0, request_controller_1.getPsbtFromRequest)(id, pubkey);
        return res.status(200).send(response);
    }
    catch (error) {
        return {
            success: false,
            message: "Something error is happening.",
            payload: null,
        };
    }
}));
requestRouter.post("/updateRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { psbt, id, pubkey } = req.body;
        console.log("updateRequest req.body ==>", req.body);
        if (!id || !pubkey || !psbt)
            return res.status(400).send({
                success: false,
                message: "Id, pubkey or psbt is missing.",
                payload: null,
            });
        const response = yield (0, request_controller_1.updateRequest)(id, psbt, pubkey);
        return res.status(200).send(response);
    }
    catch (error) {
        return {
            success: false,
            message: "Something error is happening.",
            payload: null,
        };
    }
}));
requestRouter.post("/cancelUpdateForRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, pubkey } = req.body;
        console.log("cancelUpdateForRequest req.body ==>", req.body);
        if (!id || !pubkey)
            return res.status(400).send({
                success: false,
                message: "Id or pubkey is missing.",
                payload: null,
            });
        const response = yield (0, request_controller_1.cancelUpdateForRequest)(id, pubkey);
        return res.status(200).send(response);
    }
    catch (error) { }
    return {
        success: false,
        message: "Something error is happening.",
        payload: null,
    };
}));
requestRouter.post("/exec", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("request exec api is calling!!");
    try {
        const { id } = req.body;
        const requestData = yield RequestModal_1.default.findById(id);
        if (!requestData)
            return {
                success: false,
                message: "There is no request with this id",
                payload: null,
            };
        const psbtList = requestData.psbt;
        console.log("psbtList ==> ", psbtList);
        const psbt = psbtList[0];
        const signedPSBT = psbtList[psbtList.length - 1];
        console.log("psbt ==> ", psbt);
        console.log("signedPSBT ==> ", signedPSBT);
        let sellerSignPSBT;
        sellerSignPSBT = (0, psbt_service_1.finalizePsbtInput)(signedPSBT, [0]);
        const txID = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log(txID);
        return res.status(200).json({
            success: true,
            message: "Transaction broadcasting successfully.",
            payload: txID,
        });
    }
    catch (error) {
        console.log("Error : ", error);
        return res.status(500).json({ success: false });
    }
}));
requestRouter.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, request_controller_1.test)();
        return res.status(200).send(response);
    }
    catch (error) {
        return {
            success: false,
            message: "Something error is happening.",
            payload: null,
        };
    }
}));
exports.default = requestRouter;
