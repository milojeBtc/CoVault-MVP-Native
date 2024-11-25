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
exports.joinPendingVaultController = exports.createPendingVaultController = exports.sendTapOrdinalsController = exports.fetchTapBalanceList = exports.signAndSend = exports.generateInscribe = exports.getInscribe = exports.generateDummyInscribe = exports.inscribeText = exports.waitUntilUTXO = exports.createparentInscriptionTapScript = exports.sendbrc20Controller = exports.sendOrdinalsController = exports.sendRuneController = exports.sendBtcController = exports.getBtcAndRuneByAddressController = exports.transferAllAssets = exports.reCreateNativeSegwit = exports.makeRequest = exports.loadOneMusigWallets = exports.loadAllMusigWallets = exports.createNativeSegwit = void 0;
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const psbt_service_1 = require("../service/psbt.service");
const function_1 = require("../utils/function");
const type_1 = require("../type");
const Multisig_1 = __importDefault(require("../model/Multisig"));
const RequestModal_1 = __importDefault(require("../model/RequestModal"));
const runelib_1 = require("runelib");
const TempMultisig_1 = __importDefault(require("../model/TempMultisig"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const ecpair_1 = require("ecpair");
const TaprootMultisig_1 = __importDefault(require("../model/TaprootMultisig"));
const WIFWallet_1 = require("../utils/WIFWallet");
const utils_service_1 = require("../utils/utils.service");
const PendingMultisig_1 = __importDefault(require("../model/PendingMultisig"));
const taproot_controller_1 = require("./taproot.controller");
const bitcoin = require("bitcoinjs-lib");
const schnorr = require("bip-schnorr");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const ECPair = ECPairFactory(ecc);
const network = config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin; // Otherwise, bitcoin = mainnet and regnet = local
const blockstream = new axios_1.default.Axios({
    baseURL: config_1.TEST_MODE
        ? `https://mempool.space/testnet/api`
        : `https://mempool.space/api`,
});
function createNativeSegwit(vaultName, originPubkeys, threshold, assets, network, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existMusigWallet = yield Multisig_1.default.findOne({
                cosigner: originPubkeys,
            });
            if (existMusigWallet)
                return {
                    success: false,
                    message: "These public key pair is already existed.",
                    payload: null,
                };
            const hexedPubkeys = originPubkeys.map((pubkey) => Buffer.from(pubkey, "hex"));
            console.log("hexedPubkeys ==> ", hexedPubkeys);
            const p2ms = bitcoin.payments.p2ms({
                m: parseInt(threshold.toString()),
                pubkeys: hexedPubkeys,
                network,
            });
            const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
            const newMultisigWallet = new Multisig_1.default({
                vaultName,
                cosigner: originPubkeys,
                witnessScript: p2wsh.redeem.output.toString("hex"),
                p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
                address: p2wsh.address,
                threshold,
                assets,
                imageUrl,
            });
            yield newMultisigWallet.save();
            console.log("created newMultisigWallet ==> ", newMultisigWallet._id.toString());
            return {
                success: true,
                message: "Create Musig Wallet successfully.",
                payload: {
                    DBID: newMultisigWallet._id.toString(),
                    address: p2wsh.address,
                },
            };
        }
        catch (error) {
            console.log("error in creating segwit address ==> ", error);
            return {
                success: false,
                message: "There is something error",
                payload: null,
            };
        }
    });
}
exports.createNativeSegwit = createNativeSegwit;
function loadAllMusigWallets() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const allMuwallets = yield Multisig_1.default.find();
            let message = "";
            if (!allMuwallets.length)
                message = "There is no multisig wallet.";
            else
                message = "Fetch all multisig wallet successfully";
            return {
                success: true,
                message,
                payload: allMuwallets,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error,
                payload: null,
            };
        }
    });
}
exports.loadAllMusigWallets = loadAllMusigWallets;
function loadOneMusigWallets(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const oneMuwallets = yield Multisig_1.default.findById(id);
            if (oneMuwallets)
                return {
                    success: true,
                    message: "Native Segwit Vault is fetched successfully.",
                    payload: oneMuwallets,
                };
            const oneTaprootVault = yield TaprootMultisig_1.default.findById(id);
            if (oneTaprootVault)
                return {
                    success: true,
                    message: "Taproot Vault is fetched successfully.",
                    payload: oneTaprootVault,
                };
            return {
                success: false,
                message: "Not Found.",
                payload: null,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error,
                payload: null,
            };
        }
    });
}
exports.loadOneMusigWallets = loadOneMusigWallets;
function makeRequest(id, transferAmount, destinationAddress, ordinalAddress, pubKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const MusigWallet = yield Multisig_1.default.findById(id);
        if (!MusigWallet)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = MusigWallet;
        const pubkeyAllowed = cosigner.findIndex((key) => key == pubKey);
        if (pubkeyAllowed < 0)
            return {
                success: false,
                message: "Not allowed pubkey.",
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
            };
        if (!assets.runeName && !assets.runeAmount)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
            };
        const assetsAllowed = yield (0, function_1.checkingAssets)(ordinalAddress, assets.runeName, parseInt(assets.runeAmount));
        if (!assetsAllowed)
            return {
                success: false,
                message: "Not have enough assets in this address",
            };
        const psbt = new bitcoin.Psbt({ network });
        const usedUtxoIds = [];
        let total = 0;
        const utxos = yield (0, function_1.getUTXOByAddress)(address);
        if (utxos.length == 0) {
            return "There is no UTXO in this address";
        }
        for (const utxo of utxos) {
            if (total < transferAmount + 25000 && utxo.value > 1000) {
                usedUtxoIds.push(utxo.txid);
                total += utxo.value;
                const utxoHex = yield (0, function_1.getTxHexById)(utxo.txid);
                console.log("selected utxoHex ==> ", utxoHex);
                console.log("addInput ==> ", {
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: utxo.value,
                    },
                });
                yield psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: utxo.value,
                    },
                });
            }
        }
        psbt.addOutput({
            address: destinationAddress,
            value: transferAmount,
        });
        // const feeRate = await getFeeRate();
        const feeRate = 300;
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        console.log("feeRate ==> ", feeRate);
        console.log("fee ==> ", fee);
        psbt.addOutput({
            address: address,
            value: total - fee - transferAmount,
        });
        const newRequest = new RequestModal_1.default({
            musigId: MusigWallet._id,
            type: "Tranfer" /* RequestType.Tranfer */,
            transferAmount,
            destinationAddress,
            creator: ordinalAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return psbt.toHex();
    });
}
exports.makeRequest = makeRequest;
function reCreateNativeSegwit(originPubkeys, threshold, assets, network, vaultId, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("reCreateNativeSegwit ==> ");
            const existMusigWallet = yield Multisig_1.default.findOne({
                cosigner: originPubkeys,
            });
            console.log("existMusigWallet ==> ", existMusigWallet);
            console.log("existMusigWallet ==> ", existMusigWallet === null || existMusigWallet === void 0 ? void 0 : existMusigWallet._id);
            console.log("vaultId ==> ", vaultId);
            if (existMusigWallet && existMusigWallet._id != vaultId) {
                console.log("These public key pair is already existed in other wallets.");
                return {
                    success: false,
                    message: "These public key pair is already existed in other wallets.",
                    payload: null,
                };
            }
            console.log("vaultId ==> ", vaultId);
            const hexedPubkeys = originPubkeys.map((pubkey) => Buffer.from(pubkey, "hex"));
            const p2ms = bitcoin.payments.p2ms({
                m: parseInt(threshold.toString()),
                pubkeys: hexedPubkeys,
                network,
            });
            const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
            console.log("p2wsh ==> ", p2wsh);
            const newMultisigWallet = new TempMultisig_1.default({
                cosigner: originPubkeys,
                witnessScript: p2wsh.redeem.output.toString("hex"),
                p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
                address: p2wsh.address,
                threshold,
                assets,
                imageUrl,
            });
            yield newMultisigWallet.save();
            return {
                success: true,
                message: "Create Musig Wallet temporary.",
                payload: newMultisigWallet,
            };
            // Make the request
        }
        catch (error) {
            console.log("When create the Musig wallet ==> ", error);
            return {
                success: false,
                message: "There is something error",
                payload: null,
            };
        }
    });
}
exports.reCreateNativeSegwit = reCreateNativeSegwit;
function transferAllAssets(oldVault, newVault, ordinalAddress) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        console.log("transferAllAssets ==> ");
        const oldAddress = oldVault.address;
        const destinationAddress = newVault.address;
        const thresHoldValue = oldVault.threshold;
        const { witnessScript, p2msOutput } = oldVault;
        console.log(oldAddress, destinationAddress);
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(oldAddress);
        const runeIdList = yield (0, psbt_service_1.getAllRuneIdList)(oldAddress);
        if (!btcUtxos.length && !runeIdList.length) {
            TempMultisig_1.default.findByIdAndDelete(newVault._id);
            throw "There is no any BTC in vault for updating.";
        }
        const psbt = new bitcoinjs_lib_1.Psbt({ network });
        // Rune utxo input
        for (const runeId of runeIdList) {
            const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(oldAddress, runeId);
            console.log("runeUtxos ======>", runeUtxos.runeUtxos);
            // create rune utxo input && edict
            for (const runeutxo of runeUtxos.runeUtxos) {
                psbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: runeutxo.value,
                    },
                });
                psbt.addOutput({
                    address: destinationAddress,
                    value: runeutxo.value,
                });
            }
        }
        // add btc utxo input
        let totalBtcAmount = 0;
        for (const btcutxo of btcUtxos) {
            if (btcutxo.value > 546) {
                totalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        const feeRate = Math.floor(yield (0, psbt_service_1.getFeeRate)());
        console.log("feeRate ==> ", feeRate);
        // console.log("psbt ==> ", psbt);
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        psbt.addOutput({
            address: config_1.SERVICE_FEE_ADDRESS,
            value: serverFeeSats,
        });
        const fee = (0, psbt_service_1.transferAllAssetsFeeCalc)(psbt, feeRate, thresHoldValue);
        console.log("Pay Fee ==>", fee);
        if (totalBtcAmount < fee) {
            TempMultisig_1.default.findByIdAndDelete(newVault._id);
            throw "BTC balance is not enough for pay fee";
        }
        console.log("totalBtcAmount ====>", totalBtcAmount);
        psbt.addOutput({
            address: destinationAddress,
            value: totalBtcAmount - serverFeeSats - fee,
        });
        console.log("psbt ==> ");
        console.log(psbt);
        console.log("psbt ============>", psbt.toHex());
        // Make the request
        const newRequest = new RequestModal_1.default({
            musigId: oldVault._id,
            type: "VaultUpgrade" /* RequestType.VaultUpgrade */,
            transferAmount: "ALL",
            destinationAddress,
            creator: ordinalAddress,
            signedCosigner: [],
            cosigner: oldVault.cosigner,
            psbt: [psbt.toHex()],
            threshold: oldVault.threshold,
            assets: {
                initialPrice: (_a = oldVault.assets) === null || _a === void 0 ? void 0 : _a.initialPrice,
                runeName: (_b = oldVault.assets) === null || _b === void 0 ? void 0 : _b.runeName,
                runeAmount: (_c = oldVault.assets) === null || _c === void 0 ? void 0 : _c.runeAmount,
                runeSymbol: (_d = oldVault.assets) === null || _d === void 0 ? void 0 : _d.runeSymbol,
                creatorAddress: (_e = oldVault.assets) === null || _e === void 0 ? void 0 : _e.creatorAddress,
            },
            pending: "",
        });
        yield newRequest.save();
        return {
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
        };
    });
}
exports.transferAllAssets = transferAllAssets;
function getBtcAndRuneByAddressController(address) {
    return __awaiter(this, void 0, void 0, function* () {
        const btcUrl = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/balance`;
        console.log("url ==> ", btcUrl);
        const config = {
            headers: {
                Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
            },
        };
        const btcBalance = (yield axios_1.default.get(btcUrl, config)).data.data.btcSatoshi;
        console.log("btcBalance ==> ", btcBalance);
        const runeUrl = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/balance-list?start=0&limit=500`;
        console.log("url ==> ", runeUrl);
        const runeBalance = (yield axios_1.default.get(runeUrl, config)).data.data.detail;
        console.log("runeBalance ==> ", runeBalance);
        const inscriptionUrl = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/inscription-data`;
        console.log("inscriptionUrl ==> ", inscriptionUrl);
        const inscriptionList = (yield axios_1.default.get(inscriptionUrl, config)).data.data
            .inscription;
        const ordinalsList = [];
        const brc20List = [];
        const brc20Url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/brc20/summary`;
        console.log("brc20Url ==> ", brc20Url);
        const brc20Balance = (yield axios_1.default.get(brc20Url, config)).data.data.detail;
        // inscriptionList.map((inscription: any) => {
        for (const inscription of inscriptionList) {
            const temp = inscription.utxo.inscriptions[0];
            const content = (yield axios_1.default.get(`${config_1.ORDINAL_URL}/${temp.inscriptionId}`))
                .data;
            if (!temp.isBRC20 && content.p != "tap") {
                ordinalsList.push({
                    inscriptionNumber: temp.inscriptionNumber,
                    inscriptionId: temp.inscriptionId,
                });
            }
        }
        for (const brc20 of brc20Balance) {
            brc20List.push({
                ticker: brc20.ticker,
                amount: brc20.overallBalance,
            });
        }
        console.log("ordinalsList ==> ", ordinalsList);
        console.log("brc20List ==> ", brc20List);
        return {
            btcBalance,
            runeBalance,
            ordinalsList,
            brc20List,
        };
    });
}
exports.getBtcAndRuneByAddressController = getBtcAndRuneByAddressController;
function sendBtcController(walletId, destination, amount, paymentAddress, ordinalAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("walletId ==> ", walletId);
        console.log("destination ==> ", destination);
        console.log("amount ==> ", amount);
        const multisigVault = yield Multisig_1.default.findById(walletId);
        if (!multisigVault)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
                payload: null,
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = multisigVault;
        const psbt = new bitcoinjs_lib_1.Psbt({
            network: config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin,
        });
        if (!multisigVault)
            return {
                success: false,
                message: "There is no wallet with this id.",
                payload: null,
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
                payload: null,
            };
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(multisigVault.address);
        console.log("btcUtxos ==> ", btcUtxos);
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let totalBtcAmount = 0;
        let fee = 0;
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        for (const btcutxo of btcUtxos) {
            fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee + amount * 1 + serverFeeSats &&
                btcutxo.value > 1000) {
                totalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("totalBtcAmount ==> ", totalBtcAmount);
        console.log("fee ==> ", fee);
        console.log("amount ==> ", amount);
        console.log("fee + amount*1 ==> ", fee + amount * 1);
        let outputCount = 0;
        psbt.addOutput({
            address: destination,
            value: amount * 1,
        });
        outputCount++;
        psbt.addOutput({
            address: config_1.FEE_ADDRESS,
            value: serverFeeSats,
        });
        outputCount++;
        fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount < fee + amount * 1)
            return {
                success: false,
                message: "BTC balance is not enough",
                payload: null,
            };
        psbt.addOutput({
            address: multisigVault.address,
            value: totalBtcAmount - serverFeeSats - amount - fee,
        });
        console.log("paymentAddress ==> ", paymentAddress);
        const newRequest = new RequestModal_1.default({
            musigId: walletId,
            type: "Tranfer" /* RequestType.Tranfer */,
            transferAmount: amount,
            destinationAddress: destination,
            creator: paymentAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return {
            success: true,
            message: "Generating PSBT successfully.",
            payload: psbt.toHex(),
        };
    });
}
exports.sendBtcController = sendBtcController;
function sendRuneController(walletId, destination, runeId, amount, ordinalAddress, pubKey) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("walletId ==> ", walletId);
        console.log("destination ==> ", destination);
        console.log("amount ==> ", amount);
        console.log("runeId ==> ", runeId);
        console.log("ordinalAddress ==> ", ordinalAddress);
        const multisigVault = yield Multisig_1.default.findById(walletId);
        if (!multisigVault)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
                payload: null,
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = multisigVault;
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        const psbt = new bitcoinjs_lib_1.Psbt({
            network: config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin,
        });
        if (!multisigVault)
            return {
                success: false,
                message: "There is no wallet with this id.",
                payload: null,
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
                payload: null,
            };
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
        const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(address, runeId);
        const FinalEdicts = [];
        let FinaltokenSum = 0;
        const runeBlockNumber = parseInt(runeId.split(":")[0]);
        const runeTxout = parseInt(runeId.split(":")[1]);
        for (const runeutxo of runeUtxos.runeUtxos) {
            psbt.addInput({
                hash: runeutxo.txid,
                index: runeutxo.vout,
                witnessScript: Buffer.from(witnessScript, "hex"),
                witnessUtxo: {
                    value: runeutxo.value,
                    script: Buffer.from(p2msOutput, "hex"),
                },
            });
            FinaltokenSum += runeutxo.amount * Math.pow(10, runeutxo.divisibility);
        }
        if (FinaltokenSum - amount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) > 0) {
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: amount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 2,
            });
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: FinaltokenSum - amount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 1,
            });
        }
        else {
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: parseInt(amount.toString()),
                output: 1,
            });
        }
        console.log("FinaltokenSum ==> ", FinaltokenSum);
        console.log("transferAmount ==> ", FinalEdicts);
        const Finalmintstone = new runelib_1.Runestone(FinalEdicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
        psbt.addOutput({
            script: Finalmintstone.encipher(),
            value: 0,
        });
        if (FinaltokenSum - amount > 0) {
            psbt.addOutput({
                address: address,
                value: 546,
            });
        }
        // add rune receiver address
        psbt.addOutput({
            address: destination,
            value: 546,
        });
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let FinalTotalBtcAmount = 0;
        let finalFee = 0;
        for (const btcutxo of btcUtxos) {
            finalFee = yield (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (FinalTotalBtcAmount < finalFee + serverFeeSats &&
                btcutxo.value > 1000) {
                FinalTotalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("Pay finalFee =====================>", finalFee);
        if (FinalTotalBtcAmount < finalFee)
            return {
                success: false,
                message: "BTC balance is not enough",
                payload: null,
            };
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        psbt.addOutput({
            address: config_1.FEE_ADDRESS,
            value: serverFeeSats,
        });
        psbt.addOutput({
            address: address,
            value: FinalTotalBtcAmount - finalFee - serverFeeSats,
        });
        const newRequest = new RequestModal_1.default({
            musigId: walletId,
            type: "Tranfer" /* RequestType.Tranfer */,
            transferAmount: amount,
            destinationAddress: destination,
            creator: ordinalAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return {
            success: true,
            message: "Generating PSBT successfully",
            payload: psbt.toHex(),
        };
    });
}
exports.sendRuneController = sendRuneController;
function sendOrdinalsController(walletId, destination, inscriptionId, paymentAddress, ordinalAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("walletId ==> ", walletId);
        console.log("destination ==> ", destination);
        console.log("inscriptionId ==> ", inscriptionId);
        console.log("paymentAddress ==> ", paymentAddress);
        const multisigVault = yield Multisig_1.default.findById(walletId);
        if (!multisigVault)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = multisigVault;
        const psbt = new bitcoinjs_lib_1.Psbt({
            network: config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin,
        });
        if (!multisigVault)
            return {
                success: false,
                message: "There is no wallet with this id.",
                payload: null,
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
            };
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        const inscriptionData = yield (0, function_1.getInscriptionData)(multisigVault.address, inscriptionId
        // "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
        );
        psbt.addInput({
            hash: inscriptionData.txid,
            index: inscriptionData.vout,
            witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
            witnessUtxo: {
                script: Buffer.from(multisigVault.p2msOutput, "hex"),
                value: inscriptionData.satoshi,
            },
        });
        psbt.addOutput({
            address: destination,
            value: inscriptionData.satoshi,
        });
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let FinalTotalBtcAmount = 0;
        let finalFee = 0;
        for (const btcutxo of btcUtxos) {
            finalFee = yield (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (FinalTotalBtcAmount < finalFee + serverFeeSats &&
                btcutxo.value > 1000) {
                FinalTotalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("Pay finalFee =====================>", finalFee);
        if (FinalTotalBtcAmount < finalFee)
            throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        psbt.addOutput({
            address: config_1.FEE_ADDRESS,
            value: serverFeeSats,
        });
        psbt.addOutput({
            address: address,
            value: FinalTotalBtcAmount - finalFee - serverFeeSats,
        });
        const newRequest = new RequestModal_1.default({
            musigId: walletId,
            type: "Tranfer" /* RequestType.Tranfer */,
            transferAmount: 1,
            destinationAddress: destination,
            creator: paymentAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return psbt.toHex();
    });
}
exports.sendOrdinalsController = sendOrdinalsController;
function sendbrc20Controller(vaultId, inscriptionId, destination, ticker, amount, paymentAddress, ordinalAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("walletId ==> ", vaultId);
        console.log("destination ==> ", destination);
        console.log("inscriptionId ==> ", inscriptionId);
        console.log("paymentAddress ==> ", paymentAddress);
        console.log("ticker ==> ", inscriptionId);
        console.log("amount ==> ", paymentAddress);
        const multisigVault = yield Multisig_1.default.findById(vaultId);
        if (!multisigVault)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = multisigVault;
        const psbt = new bitcoinjs_lib_1.Psbt({
            network: config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin,
        });
        if (!multisigVault)
            return {
                success: false,
                message: "There is no wallet with this id.",
                payload: null,
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
            };
        const inscriptionData = yield (0, function_1.getInscriptionData)(multisigVault.address, inscriptionId);
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        psbt.addInput({
            hash: inscriptionData.txid,
            index: inscriptionData.vout,
            witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
            witnessUtxo: {
                script: Buffer.from(multisigVault.p2msOutput, "hex"),
                value: inscriptionData.satoshi,
            },
        });
        psbt.addOutput({
            address: destination,
            value: inscriptionData.satoshi,
        });
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let FinalTotalBtcAmount = 0;
        let finalFee = 0;
        for (const btcutxo of btcUtxos) {
            finalFee = yield (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (FinalTotalBtcAmount < finalFee + serverFeeSats &&
                btcutxo.value > 1000) {
                FinalTotalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("Pay finalFee =====================>", finalFee);
        if (FinalTotalBtcAmount < finalFee)
            throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        psbt.addOutput({
            address: config_1.FEE_ADDRESS,
            value: serverFeeSats,
        });
        psbt.addOutput({
            address: address,
            value: FinalTotalBtcAmount - finalFee - serverFeeSats,
        });
        const newRequest = new RequestModal_1.default({
            musigId: vaultId,
            type: `${"Brc20" /* RequestType.Brc20 */}-${ticker.toUpperCase()}`,
            transferAmount: amount,
            destinationAddress: destination,
            creator: paymentAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return psbt.toHex();
    });
}
exports.sendbrc20Controller = sendbrc20Controller;
function createparentInscriptionTapScript(pubkey, itemList) {
    const temp = {
        p: "tap",
        op: "token-send",
        items: itemList,
    };
    const tokenSend = JSON.stringify(temp);
    // const tokenSend = `{
    //   "p" : "tap",
    //   "op" : "token-send",
    //   "items" : [
    //     {
    //       "tick": "TAPIS",
    //       "amt": "200",
    //       "address" : "tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"
    //     },
    //     {
    //       "tick": "TAPIS",
    //       "amt": "150",
    //       "address" : "tb1p5pr8d9zn608mnau0rqlsum9xrdgnaqesmy7evn84g6vukhsxal6qu7p92l"
    //     }
    //   ]
    // }`;
    // const tokenSend = '{"p":"tap","op":"token-send","items":[{"tick":"TAPIS","amt":200,"address":"tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"},{"tick":"TAPIS","amt":150,"address":"tb1p5pr8d9zn608mnau0rqlsum9xrdgnaqesmy7evn84g6vukhsxal6qu7p92l"}]}'
    // console.log(tokenSend)
    console.log(JSON.stringify({
        p: "tap",
        op: "token-send",
        items: itemList,
    }));
    const parentOrdinalStacks = [
        (0, bip371_1.toXOnly)(pubkey),
        bitcoin.opcodes.OP_CHECKSIG,
        bitcoin.opcodes.OP_FALSE,
        bitcoin.opcodes.OP_IF,
        Buffer.from("ord", "utf8"),
        1,
        1,
        // @ts-ignore
        Buffer.concat([Buffer.from("text/plain;charset=utf-8", "utf8")]),
        bitcoin.opcodes.OP_0,
        // @ts-ignore
        // Buffer.concat([Buffer.from(JSON.stringify(tokenSend), "utf8")]),
        Buffer.concat([Buffer.from(tokenSend, "utf8")]),
        bitcoin.opcodes.OP_ENDIF,
    ];
    return parentOrdinalStacks;
}
exports.createparentInscriptionTapScript = createparentInscriptionTapScript;
function waitUntilUTXO(address) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let intervalId;
            const checkForUtxo = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield blockstream.get(`/address/${address}/utxo`);
                    const data = response.data
                        ? JSON.parse(response.data)
                        : undefined;
                    console.log(data);
                    if (data.length > 0) {
                        resolve(data);
                        clearInterval(intervalId);
                    }
                }
                catch (error) {
                    reject(error);
                    clearInterval(intervalId);
                }
            });
            intervalId = setInterval(checkForUtxo, 4000);
        });
    });
}
exports.waitUntilUTXO = waitUntilUTXO;
const inscribeText = (paymentAddress, paymentPublicKey, itemList, walletType) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const keyPair = ECPair.makeRandom({ network: network });
        const privateKey = keyPair.toWIF();
        const parentOrdinalStack = createparentInscriptionTapScript(keyPair.publicKey, itemList);
        const ordinal_script = bitcoin.script.compile(parentOrdinalStack);
        const scriptTree = {
            output: ordinal_script,
        };
        const redeem = {
            output: ordinal_script,
            redeemVersion: 192,
        };
        const ordinal_p2tr = bitcoin.payments.p2tr({
            internalPubkey: (0, bip371_1.toXOnly)(keyPair.publicKey),
            network,
            scriptTree,
            redeem,
        });
        const address = (_a = ordinal_p2tr.address) !== null && _a !== void 0 ? _a : "";
        console.log("send coin to address", address);
        let paymentoutput;
        console.log("walletType ==> ", walletType);
        if (walletType === config_1.WalletTypes.XVERSE) {
            const hexedPaymentPubkey = Buffer.from(paymentPublicKey, "hex");
            const p2wpkh = bitcoinjs_lib_1.payments.p2wpkh({
                pubkey: hexedPaymentPubkey,
                network: network,
            });
            const { address, redeem } = bitcoinjs_lib_1.payments.p2sh({
                redeem: p2wpkh,
                network: network,
            });
            paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
        }
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(paymentAddress);
        console.log("btcUtxos ==> ", btcUtxos);
        console.log("paymentAddress ==> ", paymentAddress);
        const psbt = new bitcoinjs_lib_1.Psbt({ network });
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let fee;
        let totalBtcAmount = 0;
        const sendAmount = yield (0, exports.generateDummyInscribe)(feeRate, itemList);
        console.log("sendAmount => ", sendAmount);
        for (const btcutxo of btcUtxos) {
            fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee + sendAmount && btcutxo.value > 1000) {
                totalBtcAmount += btcutxo.value;
                if (walletType === config_1.WalletTypes.UNISAT ||
                    walletType === config_1.WalletTypes.OKX) {
                    psbt.addInput({
                        hash: btcutxo.txid,
                        index: btcutxo.vout,
                        witnessUtxo: {
                            value: btcutxo.value,
                            script: Buffer.from(btcutxo.scriptpubkey, "hex"),
                        },
                        tapInternalKey: Buffer.from(paymentPublicKey, "hex").slice(1, 33),
                    });
                }
                else if (walletType === config_1.WalletTypes.XVERSE) {
                    const txHex = yield (0, function_1.getTxHexById)(btcutxo.txid);
                    psbt.addInput({
                        hash: btcutxo.txid,
                        index: btcutxo.vout,
                        redeemScript: paymentoutput,
                        nonWitnessUtxo: Buffer.from(txHex, "hex"),
                    });
                }
            }
        }
        fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        console.log("totalBtcAmount ==> ", totalBtcAmount);
        console.log("fee + sendAmount ==> ", fee + sendAmount);
        if (totalBtcAmount < fee + sendAmount)
            throw `You Have not got enough money. Need ${totalBtcAmount} sats but you have only ${fee + sendAmount} sats. `;
        psbt.addOutput({
            address: address,
            value: sendAmount,
        });
        psbt.addOutput({
            address: paymentAddress,
            value: totalBtcAmount - fee - sendAmount,
        });
        return {
            success: true,
            message: "Success",
            payload: {
                amount: sendAmount,
                privateKey: privateKey,
                psbt: psbt.toHex(),
            },
        };
    }
    catch (error) {
        console.log("Inscribe Text Error ", error);
        return {
            success: false,
            message: "Get failed while inscribing text",
            payload: error,
        };
    }
});
exports.inscribeText = inscribeText;
const generateDummyInscribe = (feeRate, itemList) => __awaiter(void 0, void 0, void 0, function* () {
    const privateKey = config_1.TEST_MODE
        ? "cNfPNUCLMdcSM4aJhuEiKEK44YoziFVD3EYh9tVgc4rjSTeaYwHP"
        : "Kzv5ZwHhXoNpkB5tgqLrE5sTPELE5kA8Q1DmKQBvvJstbxiZUewn";
    const receiveAddress = config_1.TEST_MODE
        ? "tb1p2vsa0qxsn96sulauasfgyyccfjdwp2rzg8h2ejpxcdauulltczuqw02jmj"
        : "bc1p82293vmfxnyd0tplme0gjzgrpte2ter30slgfk8c65wxl5vjv7dsphn0lq";
    const utxos = config_1.TEST_MODE
        ? {
            txid: "6a1e51b99bf5bb69fab155f9e1ac44b6402e0b9fb2dab715bbf9c2e09cef366c",
            vout: 0,
            value: 1000,
        }
        : {
            txid: "3b1018753057fb318c410b5d68e65a15213ad8a991e4f7804c99a7c2daf9791e",
            vout: 1,
            value: 7217,
        };
    const wallet = new WIFWallet_1.WIFWallet({
        networkType: config_1.TEST_MODE ? "testnet" : "mainnet",
        privateKey: privateKey,
    });
    const keyPair = wallet.ecPair;
    const parentOrdinalStack = createparentInscriptionTapScript(keyPair.publicKey, itemList);
    const ordinal_script = bitcoin.script.compile(parentOrdinalStack);
    const scriptTree = {
        output: ordinal_script,
    };
    const redeem = {
        output: ordinal_script,
        redeemVersion: 192,
    };
    const ordinal_p2tr = bitcoin.payments.p2tr({
        internalPubkey: (0, bip371_1.toXOnly)(keyPair.publicKey),
        network,
        scriptTree,
        redeem,
    });
    const psbt = new bitcoinjs_lib_1.Psbt({ network });
    psbt.addInput({
        hash: utxos.txid,
        index: utxos.vout,
        tapInternalKey: (0, bip371_1.toXOnly)(keyPair.publicKey),
        witnessUtxo: { value: utxos.value, script: ordinal_p2tr.output },
        tapLeafScript: [
            {
                leafVersion: redeem.redeemVersion,
                script: redeem.output,
                controlBlock: ordinal_p2tr.witness[ordinal_p2tr.witness.length - 1],
            },
        ],
    });
    psbt.addOutput({
        address: receiveAddress,
        value: 546,
    });
    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    return tx.virtualSize() * feeRate;
});
exports.generateDummyInscribe = generateDummyInscribe;
const getInscribe = (receiveAddress, privateKey, amount, hexedPsbt, signedHexedPsbt, itemList) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const psbt = bitcoin.Psbt.fromHex(hexedPsbt);
        const signedPsbt1 = bitcoin.Psbt.fromHex(signedHexedPsbt);
        psbt.combine(signedPsbt1);
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();
        const txId = yield (0, psbt_service_1.pushRawTx)(txHex);
        console.log("SendBTC => ", txId);
        const inscribeId = yield (0, exports.generateInscribe)(receiveAddress, privateKey, txId, amount, itemList);
        return {
            success: true,
            message: "Transaction is broadcasted successfuly.",
            payload: inscribeId,
        };
    }
    catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Transaction broadcasting get failed.",
            payload: null,
        };
    }
});
exports.getInscribe = getInscribe;
const generateInscribe = (receiveAddress, privateKey, txId, amount, itemList) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = new WIFWallet_1.WIFWallet({
        networkType: config_1.TEST_MODE ? "testnet" : "mainnet",
        privateKey: privateKey,
    });
    const keyPair = wallet.ecPair;
    const parentOrdinalStack = createparentInscriptionTapScript(keyPair.publicKey, itemList);
    const ordinal_script = bitcoin.script.compile(parentOrdinalStack);
    const scriptTree = {
        output: ordinal_script,
    };
    const redeem = {
        output: ordinal_script,
        redeemVersion: 192,
    };
    const ordinal_p2tr = bitcoin.payments.p2tr({
        internalPubkey: (0, bip371_1.toXOnly)(keyPair.publicKey),
        network,
        scriptTree,
        redeem,
    });
    const psbt = new bitcoinjs_lib_1.Psbt({ network });
    psbt.addInput({
        hash: txId,
        index: 0,
        tapInternalKey: (0, bip371_1.toXOnly)(keyPair.publicKey),
        witnessUtxo: { value: Number(amount), script: ordinal_p2tr.output },
        tapLeafScript: [
            {
                leafVersion: redeem.redeemVersion,
                script: redeem.output,
                controlBlock: ordinal_p2tr.witness[ordinal_p2tr.witness.length - 1],
            },
        ],
    });
    psbt.addOutput({
        address: receiveAddress,
        value: 546,
    });
    const inscribeId = yield signAndSend(keyPair, psbt);
    return inscribeId;
});
exports.generateInscribe = generateInscribe;
function signAndSend(keypair, psbt) {
    return __awaiter(this, void 0, void 0, function* () {
        psbt.signInput(0, keypair);
        psbt.finalizeAllInputs();
        const tx = psbt.extractTransaction();
        console.log(tx.virtualSize());
        console.log(tx.toHex());
        const txid = yield (0, psbt_service_1.pushRawTx)(tx.toHex());
        console.log(`Success! Txid is ${txid}`);
        return txid;
    });
}
exports.signAndSend = signAndSend;
function fetchTapBalanceList(address) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${config_1.TRAC_NETWORK_API}/getAccountTokensBalance/${address}`;
        const result = yield axios_1.default.get(url);
        console.log("tap balance url ==> ", url);
        console.log("fetchTapBalanceList result ==> ", result.data.data.list);
        const temp = result.data.data.list;
        if (!temp.length)
            return [];
        const balanceList = [];
        temp.map((tap) => {
            balanceList.push({
                ticker: tap.ticker,
                overallBalance: (parseInt(tap.overallBalance) / Math.pow(10, 18)).toString(),
                transferableBalance: tap.transferableBalance,
            });
        });
        return balanceList;
    });
}
exports.fetchTapBalanceList = fetchTapBalanceList;
function sendTapOrdinalsController(walletId, inscriptionId, paymentAddress, ordinalAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("walletId ==> ", walletId);
        console.log("inscriptionId ==> ", inscriptionId);
        console.log("paymentAddress ==> ", paymentAddress);
        console.log("ordinalAddress ==> ", ordinalAddress);
        const multisigVault = yield Multisig_1.default.findById(walletId);
        if (!multisigVault)
            return {
                success: false,
                message: "Not Found Multisig wallet.",
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets } = multisigVault;
        const psbt = new bitcoinjs_lib_1.Psbt({
            network: config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin,
        });
        if (!multisigVault)
            return {
                success: false,
                message: "There is no wallet with this id.",
                payload: null,
            };
        if (!assets)
            return {
                success: false,
                message: "Not Found Multisig Assets.",
            };
        console.log("multisigVault.address ==> ", multisigVault.address);
        console.log("inscriptionId ==> ", inscriptionId);
        let inscriptionData;
        let count = 1;
        while (1) {
            yield (0, utils_service_1.delay)(20000);
            const tempInscriptionData = yield (0, function_1.getInscriptionData)(multisigVault.address, inscriptionId
            // "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0"
            );
            console.log("inscriptionData ==> ", inscriptionData);
            if (tempInscriptionData) {
                console.log("Get inscription Success. ==> ");
                inscriptionData = tempInscriptionData;
                break;
            }
            else {
                console.log(`${count++}th attemp get failed. Now try again.`);
            }
        }
        console.log("After while statement");
        psbt.addInput({
            hash: inscriptionData.txid,
            index: inscriptionData.vout,
            witnessScript: Buffer.from(multisigVault.witnessScript, "hex"),
            witnessUtxo: {
                script: Buffer.from(multisigVault.p2msOutput, "hex"),
                value: inscriptionData.satoshi,
            },
        });
        psbt.addOutput({
            address: multisigVault.address,
            value: inscriptionData.satoshi,
        });
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        console.log("feeRate ==> ", feeRate);
        let FinalTotalBtcAmount = 0;
        let finalFee = 0;
        // Calc sats for $3
        const feeLevel = yield (0, function_1.getFeeLevel)(ordinalAddress);
        console.log("feeLevel ==> ", feeLevel);
        const serverFeeSats = yield (0, function_1.usdToSats)(feeLevel ? config_1.SERVICE_FEE_VIP : config_1.SERVICE_FEE);
        // End calc sats
        for (const btcutxo of btcUtxos) {
            finalFee = yield (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (FinalTotalBtcAmount < finalFee + serverFeeSats &&
                btcutxo.value > 1000) {
                FinalTotalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("Pay finalFee =====================>", finalFee);
        if (FinalTotalBtcAmount < finalFee)
            throw `Need more ${finalFee - FinalTotalBtcAmount} BTC for transaction`;
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        psbt.addOutput({
            address: config_1.FEE_ADDRESS,
            value: serverFeeSats,
        });
        finalFee = yield (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        psbt.addOutput({
            address: address,
            value: FinalTotalBtcAmount - finalFee - serverFeeSats,
        });
        const newRequest = new RequestModal_1.default({
            musigId: walletId,
            type: "Tapping" /* RequestType.Tapping */,
            transferAmount: 1,
            destinationAddress: multisigVault.address,
            creator: paymentAddress,
            cosigner,
            signedCosigner: [],
            psbt: [psbt.toHex()],
            threshold,
            assets,
            pending: "",
        });
        yield newRequest.save();
        console.log("psbt.toHex() ==> ", psbt.toHex());
        return psbt.toHex();
    });
}
exports.sendTapOrdinalsController = sendTapOrdinalsController;
function createPendingVaultController(vaultName, addressList, minSignCount, imageUrl, vaultType, assets, creator) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubkeyList = addressList.map(() => "");
        console.log("pubkeyList ==> ", pubkeyList);
        const newPendingModal = new PendingMultisig_1.default({
            vaultName,
            addressList,
            pubkeyList,
            threshold: minSignCount,
            vaultType,
            assets,
            imageUrl,
            creator,
        });
        yield newPendingModal.save();
        return yield PendingMultisig_1.default.find();
    });
}
exports.createPendingVaultController = createPendingVaultController;
function joinPendingVaultController(res, pendingVaultId, ordinalAddress, ordinalPubkey, paymentAddress, paymentPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pendingVault = yield PendingMultisig_1.default.findById(pendingVaultId);
            const assets = pendingVault === null || pendingVault === void 0 ? void 0 : pendingVault.assets;
            if (!assets) {
                console.log("input assets ==> ", assets);
                return res.status(200).send({
                    success: false,
                    message: "There is no assets vault in DB",
                    payload: null,
                });
            }
            const addressList = pendingVault === null || pendingVault === void 0 ? void 0 : pendingVault.addressList;
            const pubkeyList = pendingVault === null || pendingVault === void 0 ? void 0 : pendingVault.pubkeyList;
            let cosignerIndex = -1;
            if (!addressList || !pubkeyList)
                return res.status(200).send({
                    success: false,
                    message: "There is no addressList or PubkeyList in DB",
                    payload: null,
                });
            cosignerIndex = addressList.findIndex((address) => address == paymentAddress);
            if (cosignerIndex < 0) {
                return res.status(200).send({
                    success: false,
                    message: "You are not co-signer of this multisig vault",
                    payload: null,
                });
            }
            if (pubkeyList[cosignerIndex])
                return res.status(200).send({
                    success: false,
                    message: "You already joined",
                    payload: null,
                });
            pubkeyList[cosignerIndex] = paymentPubkey;
            pendingVault.pubkeyList = pubkeyList;
            yield pendingVault.save();
            let joinedCount = 0;
            pubkeyList.map((pubkey) => {
                if (pubkey)
                    joinedCount++;
            });
            const vaultName = pendingVault.vaultName;
            console.log("Joined Count ==> ", joinedCount);
            if (joinedCount < pubkeyList.length) {
                return res.status(200).send({
                    success: true,
                    message: "Joined successfully",
                    payload: yield PendingMultisig_1.default.find({ pending: true }),
                });
            }
            else {
                if (pendingVault.vaultType == type_1.VaultType.NativeSegwit) {
                    const payload = yield createNativeSegwit(vaultName, pubkeyList, pendingVault.threshold, assets, config_1.TEST_MODE ? ecpair_1.networks.testnet : ecpair_1.networks.bitcoin, pendingVault.imageUrl);
                    pendingVault.pending = false;
                    yield pendingVault.save();
                    return res.status(200).send(payload);
                }
                else {
                    const payload = yield (0, taproot_controller_1.createTaprootMultisig)(vaultName, pubkeyList, pendingVault.threshold, assets, pendingVault.imageUrl);
                    pendingVault.pending = false;
                    yield pendingVault.save();
                    return res.status(200).send(payload);
                }
            }
        }
        catch (error) {
            return res.status(400).send({
                success: false,
                payload: error,
                message: "Got error in join to Pending Vault",
            });
        }
    });
}
exports.joinPendingVaultController = joinPendingVaultController;
