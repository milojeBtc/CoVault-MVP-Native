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
exports.checkingBrc20Request = exports.test = exports.cancelUpdateForRequest = exports.updateRequest = exports.getPsbtFromRequest = exports.getOneRequestList = exports.getAllRequestList = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const psbt_service_1 = require("../service/psbt.service");
const Multisig_1 = __importDefault(require("../model/Multisig"));
const RequestModal_1 = __importDefault(require("../model/RequestModal"));
const TempMultisig_1 = __importDefault(require("../model/TempMultisig"));
const TaprootMultisig_1 = __importDefault(require("../model/TaprootMultisig"));
const TempTaprootMultisig_1 = __importDefault(require("../model/TempTaprootMultisig"));
function getAllRequestList() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allRequestModal = yield RequestModal_1.default.find();
            return allRequestModal;
        }
        catch (error) {
            console.log("getAllRequestList error ==> ", error);
            return [];
        }
    });
}
exports.getAllRequestList = getAllRequestList;
function getOneRequestList(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const requestData = yield RequestModal_1.default.findById(id);
            return requestData;
        }
        catch (error) {
            console.log("getAllRequestList error ==> ", error);
            return [];
        }
    });
}
exports.getOneRequestList = getOneRequestList;
function getPsbtFromRequest(id, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const requestData = yield RequestModal_1.default.findById(id);
            if (!requestData)
                return {
                    success: false,
                    message: "There is no request with this id",
                    payload: null,
                };
            console.log("requestData ==> ", requestData);
            const muSigId = requestData === null || requestData === void 0 ? void 0 : requestData.musigId;
            const muSigWallet = yield Multisig_1.default.findById(muSigId);
            const taprootWallet = yield TaprootMultisig_1.default.findById(muSigId);
            console.log("muSigWallet ==> ", muSigWallet);
            console.log("taprootWallet ==> ", taprootWallet);
            if (!muSigWallet && !taprootWallet)
                return {
                    success: false,
                    message: "There is no MuSig Wallet relative with request",
                    payload: null,
                };
            const isAllowed = muSigWallet
                ? muSigWallet === null || muSigWallet === void 0 ? void 0 : muSigWallet.cosigner.findIndex((key) => key == pubkey)
                : taprootWallet === null || taprootWallet === void 0 ? void 0 : taprootWallet.cosigner.findIndex((key) => key == pubkey);
            console.log("isAllowed ==> ", isAllowed);
            if (!isAllowed && isAllowed != 0)
                return {
                    success: false,
                    message: "There is no isAllowed in this request.",
                    payload: null,
                };
            if (isAllowed < 0)
                return {
                    success: false,
                    message: "This pubkey is not allowed to sign",
                    payload: null,
                };
            console.log("isAllowed ==> ", isAllowed);
            const pending = requestData.pending;
            if (pending)
                if (pending != pubkey)
                    return {
                        success: false,
                        message: `Other co-signe is signing psbt`,
                        payload: null,
                    };
                else
                    return {
                        success: true,
                        message: `You already fetch the psbt`,
                        payload: requestData.psbt[requestData.psbt.length - 1],
                    };
            requestData.pending = pubkey;
            yield requestData.save();
            return {
                success: true,
                message: "Fetch psbt successfully",
                payload: requestData.psbt[requestData.psbt.length - 1],
            };
        }
        catch (error) {
            console.log("getPsbtFromRequest error ==> ", error);
            return {
                success: false,
                message: "Something get error...",
                payload: error,
            };
        }
    });
}
exports.getPsbtFromRequest = getPsbtFromRequest;
function updateRequest(id, psbt, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const requestData = yield RequestModal_1.default.findById(id);
            if (!requestData)
                return {
                    success: false,
                    message: "There is no request with this id",
                    payload: null,
                };
            const isRepeated = requestData.signedCosigner.findIndex((key) => key == pubkey);
            if (isRepeated >= 0)
                return {
                    success: false,
                    message: "This pubkey is already signed.",
                    payload: null,
                };
            const muSigId = requestData === null || requestData === void 0 ? void 0 : requestData.musigId;
            const muSigWallet = yield Multisig_1.default.findById(muSigId);
            const taprootWallet = yield TaprootMultisig_1.default.findById(muSigId);
            const vaultType = muSigWallet ? "NativeSegwit" : "Taproot";
            console.log("muSigWallet ==> ", muSigWallet);
            console.log("taprootWallet ==> ", taprootWallet);
            if (!muSigWallet && !taprootWallet)
                return {
                    success: false,
                    message: "There is no MuSig Wallet relative with request",
                    payload: null,
                };
            const isAllowed = muSigWallet
                ? muSigWallet === null || muSigWallet === void 0 ? void 0 : muSigWallet.cosigner.findIndex((key) => key == pubkey)
                : taprootWallet === null || taprootWallet === void 0 ? void 0 : taprootWallet.cosigner.findIndex((key) => key == pubkey);
            console.log("isAllowed ==> ", isAllowed);
            if (!isAllowed && isAllowed != 0)
                return {
                    success: false,
                    message: "There is no isAllowed in this request.",
                    payload: null,
                };
            if (isAllowed < 0)
                return {
                    success: false,
                    message: "This pubkey is not allowed to sign",
                    payload: null,
                };
            const pending = requestData.pending;
            if (pending)
                if (pending != pubkey)
                    return {
                        success: false,
                        message: `Other co-signer(${pending}) is signing psbt, Try again after a few minutes`,
                        payload: null,
                    };
                else {
                    requestData.pending = "";
                    console.log("typeof requestDate ==> ", typeof requestData.psbt);
                    requestData.psbt.push(psbt);
                    requestData.signedCosigner.push(pubkey);
                    yield requestData.save();
                    // Check if reach threshold value.
                    if (requestData.signedCosigner.length >= requestData.threshold) {
                        // Broadcasting
                        const psbtList = requestData.psbt;
                        const psbt = psbtList[0];
                        const signedPSBT = psbtList[psbtList.length - 1];
                        const tempPsbt = bitcoinjs_lib_1.Psbt.fromHex(signedPSBT);
                        const inputCount = tempPsbt.inputCount;
                        const inputArray = Array.from({ length: inputCount }, (_, i) => i);
                        console.log("inputArray ==> ", inputArray);
                        // let sellerSignPSBT;
                        // sellerSignPSBT = finalizePsbtInput(signedPSBT, inputArray);
                        const sellerSignPSBT = tempPsbt.finalizeAllInputs();
                        const txID = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT.toHex());
                        console.log("combinePsbt ==> ", txID);
                        if (!txID) {
                            yield RequestModal_1.default.findByIdAndDelete(requestData._id);
                            return {
                                success: false,
                                message: "Transaction broadcasting failed. Try with another request",
                                payload: null,
                            };
                        }
                        // Remove old one and add new one into vault db.
                        if (requestData.type == "VaultUpgrade") {
                            if (vaultType == "NativeSegwit") {
                                const newTempVault = yield TempMultisig_1.default.findOne({
                                    address: requestData.destinationAddress,
                                });
                                console.log("newTempVault ==> ", newTempVault);
                                if (!newTempVault)
                                    return {
                                        success: true,
                                        message: "Transaction broadcasting But not updated DB.",
                                        payload: txID,
                                    };
                                const updatedVault = yield Multisig_1.default.findByIdAndUpdate(requestData.musigId, {
                                    cosigner: newTempVault.cosigner,
                                    witnessScript: newTempVault.witnessScript,
                                    p2msOutput: newTempVault.p2msOutput,
                                    address: newTempVault.address,
                                    threshold: newTempVault.threshold,
                                    assets: newTempVault.assets,
                                    imageUrl: newTempVault.imageUrl,
                                });
                                yield (updatedVault === null || updatedVault === void 0 ? void 0 : updatedVault.save());
                                console.log("updatedVault Saved ==> ");
                            }
                            else {
                                const newTempVault = yield TempTaprootMultisig_1.default.findOne({
                                    address: requestData.destinationAddress,
                                });
                                console.log("newTempVault ==> ", newTempVault);
                                if (!newTempVault)
                                    return {
                                        success: true,
                                        message: "Transaction broadcasting But not updated DB.",
                                        payload: txID,
                                    };
                                const updatedVault = yield TaprootMultisig_1.default.findByIdAndUpdate(requestData.musigId, {
                                    cosigner: newTempVault.cosigner,
                                    threshold: newTempVault.threshold,
                                    address: newTempVault.address,
                                    privateKey: newTempVault.privateKey,
                                    tapscript: newTempVault.tapscript,
                                    assets: newTempVault.assets,
                                    imageUrl: newTempVault.imageUrl,
                                });
                                yield (updatedVault === null || updatedVault === void 0 ? void 0 : updatedVault.save());
                                console.log("updatedVault Saved ==> ");
                            }
                        }
                        yield RequestModal_1.default.findByIdAndDelete(requestData._id);
                        return {
                            success: true,
                            message: "Transaction broadcasting successfully.",
                            payload: txID,
                        };
                    }
                    else
                        return {
                            success: true,
                            message: "Sign successfully",
                            payload: requestData.psbt,
                        };
                }
            else
                return {
                    success: false,
                    message: `You didn't fetch this psbt.`,
                    payload: null,
                };
        }
        catch (error) {
            console.log("getAllRequestList error ==> ", error);
            return [];
        }
    });
}
exports.updateRequest = updateRequest;
function cancelUpdateForRequest(id, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const requestData = yield RequestModal_1.default.findById(id);
            if (!requestData)
                return {
                    success: false,
                    message: "There is no request with this id",
                    payload: null,
                };
            const isRepeated = requestData.signedCosigner.findIndex((key) => key == pubkey);
            if (isRepeated >= 0)
                return {
                    success: false,
                    message: "This pubkey is already signed.",
                    payload: null,
                };
            const muSigId = requestData === null || requestData === void 0 ? void 0 : requestData.musigId;
            const muSigWallet = yield Multisig_1.default.findById(muSigId);
            if (!muSigWallet)
                return {
                    success: false,
                    message: "There is no MuSig Wallet",
                    payload: null,
                };
            const isAllowed = muSigWallet === null || muSigWallet === void 0 ? void 0 : muSigWallet.cosigner.findIndex((key) => key == pubkey);
            if (isAllowed < 0)
                return {
                    success: false,
                    message: "This pubkey is not allowed to sign",
                    payload: null,
                };
            const pending = requestData.pending;
            if (pending)
                if (pending != pubkey)
                    return {
                        success: false,
                        message: `Other co-signer(${pending}) is signing psbt, Try again after a few minutes`,
                        payload: null,
                    };
                else {
                    requestData.pending = "";
                    yield requestData.save();
                    return {
                        success: true,
                        message: "cancel request successfully",
                        payload: null,
                    };
                }
            else
                return {
                    success: false,
                    message: `You didn't fetch this psbt.`,
                    payload: null,
                };
        }
        catch (error) {
            console.log("getAllRequestList error ==> ", error);
            return [];
        }
    });
}
exports.cancelUpdateForRequest = cancelUpdateForRequest;
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // contant
            const txID = "a3deb57a3d8b982cd521daef908e96216afddbe5837557b83cd0483aa7188717";
            const requestData = {
                _id: "667765c7f165359feacd5572",
                musigId: "6677652ef165359feacd556b",
                type: "VaultUpgrade",
                transferAmount: "ALL",
                destinationAddress: "tb1qxk9rtvg30n7pm6wrpzjwzkmxya3ahqpt4d2cr5p3xq9veazt3twstl7wmj",
                creator: "tb1pujt7zt5s5w3jcszk3m7vl6p7rjw6rshzy6wk9svkx4jv3zxd5p9qzenv8v",
                cosigner: [
                    "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
                    "021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae8",
                ],
                signedCosigner: [
                    "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
                    "021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae8",
                ],
                psbt: [
                    "70736274ff01005e02000000012bf5d626565fc6b62abc66869e08d565ecef10db474673b78e4f31bffb46df4e0000000000ffffffff0170d5010000000000220020358a35b1117cfc1de9c308a4e15b662763db802bab5581d031300accf44b8add000000000001012bd39b020000000000220020a22eebaa0828fa55898dfa6847b4061f0e696c8e122a1d3a5276ddf1995a10ca01054752210332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec221021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae852ae0000",
                    "70736274ff01005e02000000012bf5d626565fc6b62abc66869e08d565ecef10db474673b78e4f31bffb46df4e0000000000ffffffff0170d5010000000000220020358a35b1117cfc1de9c308a4e15b662763db802bab5581d031300accf44b8add000000000001012bd39b020000000000220020a22eebaa0828fa55898dfa6847b4061f0e696c8e122a1d3a5276ddf1995a10ca22020332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec247304402201688a07ee82ec682069ca212784dca80fad478e8d1b8860bcc30460592d8dbaa02201e32e90c98af32f451f0f299bcf24c687c0e6725930bd8f9648f98e2627dda910101054752210332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec221021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae852ae0000",
                    "70736274ff01005e02000000012bf5d626565fc6b62abc66869e08d565ecef10db474673b78e4f31bffb46df4e0000000000ffffffff0170d5010000000000220020358a35b1117cfc1de9c308a4e15b662763db802bab5581d031300accf44b8add000000000001012bd39b020000000000220020a22eebaa0828fa55898dfa6847b4061f0e696c8e122a1d3a5276ddf1995a10ca2202021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae8483045022100c0078f70f620eaecbe83ed5edcce8669b32edc3d9a1adacd6beae471563ee54d02200a8c129bec20d47fb79fe0d4adf3db39b56a2baf8d25a14395ef082b72cdcbc30122020332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec247304402201688a07ee82ec682069ca212784dca80fad478e8d1b8860bcc30460592d8dbaa02201e32e90c98af32f451f0f299bcf24c687c0e6725930bd8f9648f98e2627dda910101054752210332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec221021fd26edce3324548565721728c72d9087471e127d3f4e093e78b04f4dad9aae852ae0000",
                ],
                threshold: 2,
                assets: {
                    tokenType: "brc20",
                    tokenName: "MEME",
                    tokenAmount: 200,
                },
                pending: "",
            };
            // Remove old one and add new one into vault db.
            const newTempVault = yield TempMultisig_1.default.findOne({
                address: requestData.destinationAddress,
            });
            console.log("newTempVault ==> ", newTempVault);
            if (!newTempVault)
                return {
                    success: true,
                    message: "Transaction broadcasting But not updated DB.",
                    payload: txID,
                };
            const updatedVault = yield Multisig_1.default.findByIdAndUpdate(requestData.musigId, {
                cosigner: newTempVault.cosigner,
                witnessScript: newTempVault.witnessScript,
                p2msOutput: newTempVault.p2msOutput,
                address: newTempVault.address,
                threshold: newTempVault.threshold,
                assets: newTempVault.assets,
            });
            yield (updatedVault === null || updatedVault === void 0 ? void 0 : updatedVault.save());
            console.log("updatedVault Saved ==> ");
            yield RequestModal_1.default.findByIdAndDelete(requestData._id);
            return {
                success: true,
                message: "Transaction broadcasting successfully.",
                payload: txID,
            };
        }
        catch (error) {
            console.log("error ==> ", error);
        }
    });
}
exports.test = test;
function checkingBrc20Request(multisigId, address, ticker, amount, paymentAddress, paymentPublicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("multisigId ==> ", multisigId);
        console.log("address ==> ", address);
        console.log("ticker ==> ", ticker);
        console.log("amount ==> ", amount);
        const existedRequest = yield RequestModal_1.default.find({
            musigId: multisigId,
            type: `${"Brc20" /* RequestType.Brc20 */}-${ticker.toUpperCase()}`,
            destinationAddress: address,
            transferAmount: amount
        });
        console.log("existedRequest ==> ", existedRequest);
        if (!existedRequest.length)
            return {
                success: true,
                message: "There is no existed request with these parameters",
                payload: null,
            };
        return {
            success: false,
            message: "There is already same request in DB.",
            payload: existedRequest,
        };
    });
}
exports.checkingBrc20Request = checkingBrc20Request;
