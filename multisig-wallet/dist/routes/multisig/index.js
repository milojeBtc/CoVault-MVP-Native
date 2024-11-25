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
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const nativeMusig_controller_1 = require("../../controller/nativeMusig.controller");
const nativeMusig_controller_2 = require("../../controller/nativeMusig.controller");
const Multisig_1 = __importDefault(require("../../model/Multisig"));
const taproot_controller_1 = require("../../controller/taproot.controller");
const TaprootMultisig_1 = __importDefault(require("../../model/TaprootMultisig"));
const type_1 = require("../../type");
const request_controller_1 = require("../../controller/request.controller");
const PendingMultisig_1 = __importDefault(require("../../model/PendingMultisig"));
// Create a new instance of the Express Router
const multiSigWalletRoute = (0, express_1.Router)();
// multiSigWalletRoute.post("/create-vault", async (req, res) => {
//   try {
//     console.log("create-nativeSegwit api is called!!");
//     console.log(req.body);
//     const { pubKeyList, minSignCount, assets, imageUrl, vaultType } = req.body;
//     let error = "";
//     if (!pubKeyList.length) error += "There is no publicKey value.";
//     if (!minSignCount) error += "There is no minSignCount value.";
//     if (!imageUrl) error += "There is no imageUrl value.";
//     if (!vaultType) error += "There is no vaultType value.";
//     if (minSignCount > pubKeyList.length)
//       error += "minSignCount should be less than pubkey list count";
//     if (error) {
//       console.log("input error ==> ", error);
//       return res.status(400).send({
//         success: false,
//         message: error,
//         payload: null,
//       });
//     }
//     if (vaultType == VaultType.NativeSegwit) {
//       // Create new vault.
//       const payload = await createNativeSegwit(
//         pubKeyList,
//         minSignCount,
//         assets,
//         TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin,
//         imageUrl
//       );
//       console.log("payload after createNativeSegwit ==> ", payload);
//       if (!payload.success)
//         return res.status(200).send({
//           success: payload.success,
//           message: payload.message,
//           payload: {
//             vault: null,
//             rune: null,
//           },
//         });
//       console.log("Created new vault successfully!!");
//       if (assets.runeName == "None")
//         return res.status(200).send({
//           success: payload.success,
//           message: payload.message,
//           payload: {
//             vault: payload,
//             rune: null,
//           },
//         });
//       // Etching new rune tokens
//       const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } =
//         assets;
//       const result = await createRuneToken(
//         runeName,
//         runeAmount,
//         runeSymbol,
//         initialPrice,
//         creatorAddress
//       );
//       console.log("Finished etching new rune toens ==> ", result);
//       if (!result.success) {
//         await MultisigModal.findByIdAndDelete(payload.payload?.DBID);
//         console.log("Remove new wallet cuz rune etching failed..");
//         payload.message = "Vault creation is cancelled.";
//         payload.payload = null;
//         return res.status(200).send({
//           success: result.success,
//           message: result.message,
//           payload: {
//             vault: payload,
//             rune: result,
//           },
//         });
//       }
//       return res.status(200).send({
//         success: result.success,
//         message: payload.message + " " + result.message,
//         payload: {
//           vault: payload,
//           rune: result,
//         },
//       });
//     } else {
//       const payload = await createTaprootMultisig(
//         pubKeyList,
//         minSignCount,
//         assets,
//         imageUrl
//       );
//       console.log("payload after createNativeSegwit ==> ", payload);
//       if (!payload.success)
//         return res.status(200).send({
//           success: payload.success,
//           message: payload.message,
//           payload: {
//             vault: null,
//             rune: null,
//           },
//         });
//       console.log("Created new vault successfully!!");
//       if (assets.runeName == "None")
//         return res.status(200).send({
//           success: payload.success,
//           message: payload.message,
//           payload: {
//             vault: payload,
//             rune: null,
//           },
//         });
//       // Etching new rune tokens
//       const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } =
//         assets;
//       const result = await createRuneToken(
//         runeName,
//         runeAmount,
//         runeSymbol,
//         initialPrice,
//         creatorAddress
//       );
//       console.log("Finished etching new rune toens ==> ", result);
//       if (!result.success) {
//         await MultisigModal.findByIdAndDelete(payload.payload?.DBID);
//         console.log("Remove new wallet cuz rune etching failed..");
//         payload.message = "Vault creation is cancelled.";
//         payload.payload = null;
//         return res.status(200).send({
//           success: result.success,
//           message: result.message,
//           payload: {
//             vault: payload,
//             rune: result,
//           },
//         });
//       }
//       return res.status(200).send({
//         success: result.success,
//         message: payload.message + " " + result.message,
//         payload: {
//           vault: payload,
//           rune: result,
//         },
//       });
//     }
//   } catch (error: any) {
//     console.error(error);
//     return res.status(500).send({
//       success: false,
//       message: "There is Something wrong..",
//       payload: null,
//     });
//   }
// });
multiSigWalletRoute.post("/create-pending-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { vaultName, addressList, minSignCount, assets, imageUrl, vaultType, creator } = req.body;
        let error = "";
        if (!vaultName.length)
            error += "There is no vaultName value.";
        if (!addressList.length)
            error += "There is no addressList value.";
        if (!minSignCount)
            error += "There is no minSignCount value.";
        if (!imageUrl)
            error += "There is no imageUrl value.";
        if (!vaultType)
            error += "There is no vaultType value.";
        if (!creator)
            error += "There is no creator value.";
        if (minSignCount > addressList.length)
            error += "minSignCount should be less than pubkey list count";
        if (error) {
            console.log("input error ==> ", error);
            return res.status(400).send({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.createPendingVaultController)(vaultName, addressList, minSignCount, imageUrl, vaultType, assets, creator);
        return res.status(200).send({
            success: true,
            message: "Pending Vault is saved successfully.",
            payload: result,
        });
    }
    catch (error) {
        return res.status(200).send({
            success: false,
            message: "Get some error while creating pending multisig.",
            payload: error,
        });
    }
}));
multiSigWalletRoute.post("/join-pending-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ordinalAddress, ordinalPubkey, paymentAddress, paymentPubkey, pendingVaultId, } = req.body;
    let error = "";
    if (!ordinalAddress)
        error += "There is no ordinalAddress value.";
    if (!ordinalPubkey)
        error += "There is no ordinalPubkey value.";
    if (!paymentAddress)
        error += "There is no paymentAddress value.";
    if (!paymentPubkey)
        error += "There is no paymentPubkey value.";
    if (!pendingVaultId)
        error += "There is no pendingVaultId value.";
    if (error) {
        console.log("input error ==> ", error);
        return res.status(400).send({
            success: false,
            message: error,
            payload: null,
        });
    }
    yield (0, nativeMusig_controller_1.joinPendingVaultController)(res, pendingVaultId, ordinalAddress, ordinalPubkey, paymentAddress, paymentPubkey);
}));
multiSigWalletRoute.get("/fetchVaultList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("fetchWalletList api is called!!");
        const nativeList = yield Multisig_1.default.find();
        const taprootList = yield TaprootMultisig_1.default.find();
        const pendingVaultList = yield PendingMultisig_1.default.find({
            pending: true
        });
        if (!nativeList.length && !taprootList.length && !pendingVaultList.length)
            return res.status(200).send({
                success: false,
                message: "There is no wallet here.",
                payload: [],
            });
        return res.status(200).send({
            success: true,
            message: "Fetch wallet list successfully",
            payload: {
                native: nativeList,
                taproot: taprootList,
                pendingVault: pendingVaultList
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "There is Something wrong..",
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/update-vault", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("update-vaultapi is called!!");
        const { vaultId, pubKeyList, minSignCount, assets, ordinalAddress, imageUrl, vaultType, } = req.body;
        console.log("recreate api ==> ", vaultId, pubKeyList, minSignCount, assets, ordinalAddress, imageUrl, vaultType);
        let error = "";
        if (!imageUrl)
            error += "There is no imageUrl. ";
        if (!vaultId)
            error += "There is no vaultId. ";
        if (!pubKeyList.length)
            error += "There is no publicKey value.";
        if (!minSignCount)
            error += "There is no minSignCount value.";
        if (!minSignCount)
            error += "There is no minSignCount value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (!vaultType)
            error += "There is no vaultType value.";
        if (error)
            return res.status(400).send({
                success: false,
                message: error,
                payload: null,
            });
        if (vaultType == type_1.VaultType.NativeSegwit) {
            const oldVault = yield Multisig_1.default.findById(vaultId);
            if (!oldVault)
                return res.status(200).send({
                    success: false,
                    message: "There is no exist wallet with this id",
                    payload: null,
                });
            const newWallet = yield (0, nativeMusig_controller_1.reCreateNativeSegwit)(pubKeyList, minSignCount, assets, Bitcoin.networks.testnet, vaultId, imageUrl);
            console.log("new wallet ==> ", newWallet.message);
            if (!newWallet.payload)
                return res.status(200).send({
                    success: newWallet.success,
                    message: newWallet.message,
                    payload: null,
                });
            const request = yield (0, nativeMusig_controller_1.transferAllAssets)(oldVault, newWallet.payload, ordinalAddress);
            return res.status(200).send({
                success: true,
                message: "Request saved sucessfully",
                payload: request,
            });
        }
        else {
            const oldVault = yield TaprootMultisig_1.default.findById(vaultId);
            if (!oldVault)
                return res.status(200).send({
                    success: false,
                    message: "There is no exist wallet with this id",
                    payload: null,
                });
            const newWallet = yield (0, taproot_controller_1.reCreateTaprootMultisig)(pubKeyList, minSignCount, assets, imageUrl, vaultId);
            console.log("new wallet ==> ", newWallet.message);
            if (!newWallet.payload)
                return res.status(200).send({
                    success: newWallet.success,
                    message: newWallet.message,
                    payload: null,
                });
            console.log("newWallet ==> ", newWallet);
            const request = yield (0, taproot_controller_1.transferAllTaprootAssets)(oldVault, newWallet.payload, ordinalAddress);
            return res.status(200).send({
                success: true,
                message: "Request saved sucessfully",
                payload: request,
            });
        }
        //   Transfer all assets from old to new
    }
    catch (error) {
        console.log("Updating vault error ==> ", error);
        return res.status(200).send({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/sendBtc", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletId, destination, amount, paymentAddress, ordinalAddress, vaultType, } = req.body;
        let error = "";
        if (!walletId)
            error += "There is no walletId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!amount)
            error += "There is no amount value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (!vaultType)
            error += "There is no vaultType value.";
        if (vaultType == type_1.VaultType.NativeSegwit) {
            const result = yield (0, nativeMusig_controller_1.sendBtcController)(walletId, destination, amount, paymentAddress, ordinalAddress);
            return res.status(200).send(result);
        }
        else {
            const result = yield (0, taproot_controller_1.sendBtcTaproot)(walletId, amount, destination, paymentAddress, ordinalAddress);
            return res.status(200).send(result);
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "The request is made with failure.",
            payload: error,
        });
    }
}));
multiSigWalletRoute.post("/sendRune", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { vaultId, destination, runeId, amount, ordinalAddress, ordinalPublicKey, vaultType, } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no walletId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!runeId)
            error += "There is no runeId value.";
        if (!amount)
            error += "There is no amount value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (!ordinalPublicKey)
            error += "There is no ordinalPublicKey value.";
        if (!vaultType)
            error += "There is no vaultType value.";
        if (vaultType == type_1.VaultType.NativeSegwit) {
            const result = yield (0, nativeMusig_controller_1.sendRuneController)(vaultId, destination, runeId, amount, ordinalAddress, ordinalPublicKey);
            return res.status(200).send({
                success: true,
                message: "The request is made successfully",
                payload: result,
            });
        }
        else {
            console.log("<===== Taproot Transfer ====>");
            const result = yield (0, taproot_controller_1.sendRuneTaproot)(vaultId, runeId, amount, destination, ordinalAddress);
            return res.status(200).send(result);
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.get("/getAll", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = yield (0, nativeMusig_controller_2.loadAllMusigWallets)();
    if (payload.success)
        return res.status(200).send(payload);
    else
        return res.status(500).send(payload);
}));
multiSigWalletRoute.post("/getOne", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    const payload = yield (0, nativeMusig_controller_1.loadOneMusigWallets)(id);
    if (payload.success)
        return res.status(200).send(payload);
    else
        return res.status(500).send(payload);
}));
multiSigWalletRoute.post("/createRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, transferAmount, destinationAddress, ordinalAddress, pubKey } = req.body;
    const payload = yield (0, nativeMusig_controller_1.makeRequest)(id, transferAmount, destinationAddress, ordinalAddress, pubKey);
    return res.status(200).send({
        success: true,
        message: "make the request successfully.",
        payload,
    });
}));
multiSigWalletRoute.post("/createBtcRequest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, transferAmount, destinationAddress, paymentAddress, paymentPubkey, } = req.body;
    const payload = yield (0, nativeMusig_controller_1.makeRequest)(id, transferAmount, destinationAddress, paymentAddress, paymentPubkey);
    return res.status(200).send({
        success: true,
        message: "make the request successfully.",
        payload,
    });
}));
multiSigWalletRoute.post("/getBtcAndRuneByAddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { address } = req.body;
        const payload = yield (0, nativeMusig_controller_1.getBtcAndRuneByAddressController)(address);
        return res.status(200).send({
            success: true,
            message: "Get Btc and Rune successfully.",
            payload,
        });
    }
    catch (error) {
        return res.status(200).send({
            success: false,
            message: "Get Btc and Rune failed.",
            payload: null,
        });
    }
}));
multiSigWalletRoute.get("/fetchTaprootVaultList", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("fetchTaprootVaultList api is called!!");
        const walletList = yield TaprootMultisig_1.default.find();
        if (!walletList.length)
            return res.status(200).send({
                success: false,
                message: "There is no taproot wallet here.",
                payload: [],
            });
        return res.status(200).send({
            success: true,
            message: "Fetch taproot wallet list successfully",
            payload: walletList,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "There is Something wrong..",
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/sendBtcTaproot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, amount, destinationAddress, paymentAddress, ordinalAddress } = req.body;
        const result = yield (0, taproot_controller_1.sendBtcTaproot)(id, amount, destinationAddress, paymentAddress, ordinalAddress);
        return res.status(200).send({
            success: true,
            message: "send PSBT is made successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("error ==> ", error);
    }
}));
multiSigWalletRoute.post("/sendRuneTaproot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, runeId, amount, destinationAddress, ordinalAddress } = req.body;
        const result = yield (0, taproot_controller_1.sendRuneTaproot)(id, runeId, amount, destinationAddress, ordinalAddress);
        return res.status(200).send({
            success: true,
            message: "send PSBT is made successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("error ==> ", error);
        return res.status(200).send({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/combine", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("exec in sendBtcRoute ==>  api is calling!!");
    try {
        const { id, psbt, signedPSBT, walletType } = req.body;
        const result = yield (0, taproot_controller_1.broadcastPSBT)(id, psbt, signedPSBT, walletType);
        return res.status(200).json({ success: true, result });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
}));
multiSigWalletRoute.post("/send-ordinals-ns", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("exec in send-ordinals-ns ==>  api is calling!!");
    try {
        const { vaultId, destination, inscriptionId, paymentAddress, ordinalAddress, } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no vaultId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.sendOrdinalsController)(vaultId, destination, inscriptionId, paymentAddress, ordinalAddress);
        return res.status(200).json({
            success: true,
            message: "Send ordinals request saved successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(200).json({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/send-ordinals-taproot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("send-ordinals-ns ==>  api is calling!!");
    try {
        const { vaultId, destination, inscriptionId, paymentAddress, ordinalAddress, } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no walletId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, taproot_controller_1.sendOrdinalTaproot)(vaultId, inscriptionId, destination, paymentAddress, ordinalAddress);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({
            success: true,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/send-brc20-ns", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("send-brc20-ns ==>  api is calling!!");
    try {
        const { vaultId, inscriptionId, destination, ticker, amount, paymentAddress, ordinalAddress, } = req.body;
        console.log("req.body in send-brc20-ns ==> ", req.body);
        let error = "";
        if (!vaultId)
            error += "There is no vaultId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (!ticker)
            error += "There is no vaultId value.";
        if (!amount)
            error += "There is no destination value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.sendbrc20Controller)(vaultId, inscriptionId, destination, ticker, amount, paymentAddress, ordinalAddress);
        return res.status(200).json({
            success: true,
            message: "Send brc20 request saved successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(200).json({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/send-brc20-taproot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("send-brc20-taproot ==>  api is calling!!");
    try {
        const { vaultId, inscriptionId, destination, ticker, amount, paymentAddress, } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no vaultId value.";
        if (!destination)
            error += "There is no destination value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!amount)
            error += "There is no amount value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (!ticker)
            error += "There is no amount value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, taproot_controller_1.sendBrc20Taproot)(vaultId, inscriptionId, destination, ticker, amount, paymentAddress);
        return res.status(200).json({
            success: true,
            message: "Send brc20 request saved successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({
            success: true,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/checking-brc20-request", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("checking-brc20-request ==>  api is calling!!");
    try {
        const { multisigId, address, ticker, amount, paymentAddress, paymentPublicKey, } = req.body;
        let error = "";
        if (!multisigId)
            error += "There is no multisigId value.";
        if (!address)
            error += "There is no address value.";
        if (!ticker)
            error += "There is no destination value.";
        if (!amount)
            error += "There is no amount value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (!paymentPublicKey)
            error += "There is no paymentPublicKey value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, request_controller_1.checkingBrc20Request)(multisigId, address, ticker, amount, paymentAddress, paymentPublicKey);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({
            success: true,
            message: error,
            payload: null,
        });
    }
}));
// Tap protocol
multiSigWalletRoute.post("/pre-tap-inscribe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentAddress, paymentPublicKey, itemList, walletType } = req.body;
        console.log("pre-tap-inscribe api is calling.");
        let error = "";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (!paymentPublicKey)
            error += "There is no paymentPublicKey value.";
        if (!itemList)
            error += "There is no itemList value.";
        if (!walletType)
            error += "There is no walletType value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.inscribeText)(paymentAddress, paymentPublicKey, itemList, walletType);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(200).json({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/tap-inscribe", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { receiveAddress, privateKey, amount, hexedPsbt, signedHexedPsbt, itemList, } = req.body;
        let error = "";
        if (!receiveAddress)
            error += "There is no receiveAddress value.";
        if (!privateKey)
            error += "There is no privateKey value.";
        if (!amount)
            error += "There is no amount value.";
        if (!hexedPsbt)
            error += "There is no hexedPsbt value.";
        if (!signedHexedPsbt)
            error += "There is no signedHexedPsbt value.";
        if (!itemList)
            error += "There is no itemList value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.getInscribe)(receiveAddress, privateKey, amount, hexedPsbt, signedHexedPsbt, itemList);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}));
multiSigWalletRoute.post("/get-tap-assets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.body;
    let error = "";
    if (!address)
        error += "There is no receiveAddress value.";
    if (error != "") {
        return res.status(200).json({
            success: false,
            message: error,
            payload: null,
        });
    }
    const balanceList = yield (0, nativeMusig_controller_1.fetchTapBalanceList)(address);
    return res.status(200).send({
        success: true,
        message: "Fetch Tap balance Successfully",
        payload: balanceList,
    });
}));
multiSigWalletRoute.post("/send-tap-ordinals-ns", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("exec in send-tap-ordinals-ns ==>  api is calling!!");
    try {
        const { vaultId, inscriptionId, paymentAddress, ordinalAddress } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no vaultId value.";
        if (!ordinalAddress)
            error += "There is no ordinalsAddress value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, nativeMusig_controller_1.sendTapOrdinalsController)(vaultId, inscriptionId, paymentAddress, ordinalAddress);
        return res.status(200).json({
            success: true,
            message: "Send Tap inscription request saved successfully.",
            payload: result,
        });
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(200).json({
            success: false,
            message: error,
            payload: null,
        });
    }
}));
multiSigWalletRoute.post("/send-tap-ordinals-taproot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("send-tap-ordinals-taproot ==>  api is calling!!");
    try {
        const { vaultId, inscriptionId, paymentAddress, ordinalAddress } = req.body;
        let error = "";
        if (!vaultId)
            error += "There is no walletId value.";
        if (!ordinalAddress)
            error += "There is no ordinalAddress value.";
        if (!inscriptionId)
            error += "There is no inscriptionId value.";
        if (!paymentAddress)
            error += "There is no paymentAddress value.";
        if (error != "") {
            return res.status(200).json({
                success: false,
                message: error,
                payload: null,
            });
        }
        const result = yield (0, taproot_controller_1.sendTapOrdinalTaproot)(vaultId, inscriptionId, paymentAddress);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log("exec PSBT Error : ", error);
        return res.status(500).json({
            success: true,
            message: error,
            payload: null,
        });
    }
}));
// End Tap Protocol
exports.default = multiSigWalletRoute;
