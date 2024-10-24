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
exports.batchTransfer = exports.transfer = exports.runeMintController = exports.createNativeSegwitForAirdrop = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const psbt_service_1 = require("../service/psbt.service");
const runelib_1 = require("runelib");
const AirdropVault_1 = __importDefault(require("../model/AirdropVault"));
const config_1 = require("../config/config");
const WIFWallet_1 = require("../utils/WIFWallet");
const unisat_service_1 = require("../service/unisat.service");
const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const ECPair = ECPairFactory(ecc);
const network = config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin; // Otherwise, bitcoin = mainnet and regnet = local
const keypair = ECPair.fromWIF(config_1.RUNE_WIF_KEY, network);
const pubKeyXonly = keypair.publicKey.subarray(1, 33);
function createNativeSegwitForAirdrop(originPubkeys, threshold, creator, assets, network, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existMusigWallet = yield AirdropVault_1.default.findOne({
                cosigner: originPubkeys,
            });
            if (existMusigWallet)
                return {
                    success: false,
                    message: "These public key pair is already existed.",
                    payload: null,
                };
            const hexedPubkeys = originPubkeys.map((pubkey) => Buffer.from(pubkey, "hex"));
            const p2ms = bitcoin.payments.p2ms({
                m: parseInt(threshold.toString()),
                pubkeys: hexedPubkeys,
                network,
            });
            const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
            const newMultisigWallet = new AirdropVault_1.default({
                cosigner: originPubkeys,
                witnessScript: p2wsh.redeem.output.toString("hex"),
                p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
                address: p2wsh.address,
                threshold,
                creator,
                assets,
                imageUrl
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
exports.createNativeSegwitForAirdrop = createNativeSegwitForAirdrop;
function runeMintController(paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey, runeName, runeAmount, initialPrice, creator) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(paymentAddress, paymentPublicKey, ordinalAddress, ordinalPublicKey);
        console.log(runeName, runeAmount, initialPrice, creator);
        const newWIFWallet = new WIFWallet_1.WIFWallet({
            networkType: config_1.TEST_MODE ? "testnet" : "mainnet",
            privateKey: config_1.WIF_KEY,
        });
        const price = parseInt(initialPrice);
        const serverFee = Math.max(Math.floor(price * config_1.SERVER_FEE_PERCENT), 2000);
        const transferAmount = 1;
        // get runeId from rune name
        const name = runeName.replaceAll(".", "•");
        const originalName = runeName.replaceAll(".", "").toLocaleUpperCase();
        console.log("Original Name ==>", originalName);
        const runeId = yield (0, psbt_service_1.getRuneIdByName)(originalName);
        if (!runeId)
            return {
                success: false,
                message: "The Rune Name is invalid.",
                payload: null,
            };
        // const runeId = "2819010:1919";
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(paymentAddress);
        const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(config_1.ADMIN_ADDRESS, runeId);
        console.log("runeUtxos ==> ", runeUtxos);
        if (runeUtxos.tokenSum < transferAmount) {
            throw "Invalid amount";
        }
        // const feeRate = TEST_MODE ? 300 : 15;
        const feeRate = (yield (0, psbt_service_1.getFeeRate)()) + 10;
        const runeBlockNumber = parseInt(runeId.split(":")[0]);
        const runeTxout = parseInt(runeId.split(":")[1]);
        const psbt = new bitcoinjs_lib_1.Psbt({ network });
        const edicts = [];
        let tokenSum = 0;
        // create rune utxo input && edict
        for (const runeutxo of runeUtxos.runeUtxos) {
            if (tokenSum < transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility)) {
                psbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    tapInternalKey: pubKeyXonly,
                    witnessUtxo: {
                        value: runeutxo.value,
                        script: newWIFWallet.output,
                    },
                });
                console.log("runeutxo.amount ==> ", runeutxo.amount);
                tokenSum += runeutxo.amount;
            }
        }
        console.log("transferAmount ==> ", transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("Rest Amount ==> ", tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("tokenSum ==> ", tokenSum);
        if (tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
            0) {
            edicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 2,
            });
            edicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 1,
            });
        }
        else {
            edicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: parseInt(transferAmount.toString()),
                output: 1,
            });
        }
        console.log("tokenSum ==> ", tokenSum);
        console.log("transferAmount ==> ", edicts);
        const mintstone = new runelib_1.Runestone(edicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
        psbt.addOutput({
            script: mintstone.encipher(),
            value: 0,
        });
        if (tokenSum - transferAmount > 0) {
            psbt.addOutput({
                address: config_1.ADMIN_ADDRESS,
                value: 546,
            });
        }
        // add rune receiver address
        psbt.addOutput({
            address: ordinalAddress,
            value: 546,
        });
        // const feeRate = await getFeeRate();
        console.log("feeRate ==> ", feeRate);
        // add btc utxo input
        let totalBtcAmount = 0;
        console.log("btcUtxos ==> ", btcUtxos);
        for (const btcutxo of btcUtxos) {
            const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee + price + serverFee && btcutxo.value > 10000) {
                totalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    tapInternalKey: Buffer.from(paymentPublicKey, "hex").slice(1, 33),
                    witnessUtxo: {
                        script: newWIFWallet.output,
                        value: btcutxo.value,
                    },
                });
            }
        }
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        console.log("Pay Fee =====================>", fee);
        console.log("totalBtcAmount ====>", totalBtcAmount);
        if (totalBtcAmount < fee + price + serverFee)
            throw "BTC balance is not enough";
        psbt.addOutput({
            address: config_1.ADMIN_ADDRESS,
            value: serverFee,
        });
        psbt.addOutput({
            address: paymentAddress,
            value: totalBtcAmount - (fee + price + serverFee),
        });
        psbt.addOutput({
            address: creator.paymentAddress,
            value: price,
        });
        const redeemPsbt = newWIFWallet.signPsbt(psbt, newWIFWallet.ecPair);
        const finalFee = redeemPsbt.extractTransaction(true).virtualSize() * feeRate;
        //  ==============================
        //  ==============================
        //  ==============================
        const Finalpsbt = new bitcoinjs_lib_1.Psbt({ network });
        const FinalEdicts = [];
        const serverInput = [];
        const clientInput = [];
        let inputCount = 0;
        let FinaltokenSum = 0;
        // create rune utxo input && edict
        for (const runeutxo of runeUtxos.runeUtxos) {
            if (FinaltokenSum <
                transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility)) {
                Finalpsbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    tapInternalKey: pubKeyXonly,
                    witnessUtxo: {
                        value: runeutxo.value,
                        script: Buffer.from(runeutxo.scriptpubkey, "hex"),
                    },
                });
                FinaltokenSum += runeutxo.amount * Math.pow(10, runeutxo.divisibility);
                serverInput.push(inputCount);
                inputCount++;
            }
        }
        console.log("transferAmount ==> ", transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("Rest Amount ==> ", FinaltokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("FinaltokenSum ==> ", FinaltokenSum);
        if (FinaltokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
            0) {
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 2,
            });
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: FinaltokenSum -
                    transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 1,
            });
        }
        else {
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: parseInt(transferAmount.toString()),
                output: 1,
            });
        }
        console.log("FinaltokenSum ==> ", FinaltokenSum);
        console.log("transferAmount ==> ", FinalEdicts);
        const Finalmintstone = new runelib_1.Runestone(FinalEdicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
        Finalpsbt.addOutput({
            script: Finalmintstone.encipher(),
            value: 0,
        });
        if (FinaltokenSum - transferAmount > 0) {
            Finalpsbt.addOutput({
                address: config_1.ADMIN_ADDRESS,
                value: 546,
            });
        }
        // add rune receiver address
        Finalpsbt.addOutput({
            address: ordinalAddress,
            value: 546,
        });
        console.log("feeRate ==> ", feeRate);
        // add btc utxo input
        let FinalTotalBtcAmount = 0;
        for (const btcutxo of btcUtxos) {
            if (FinalTotalBtcAmount < finalFee + price + serverFee &&
                btcutxo.value > 10000) {
                FinalTotalBtcAmount += btcutxo.value;
                clientInput.push(inputCount);
                inputCount++;
                Finalpsbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    tapInternalKey: Buffer.from(paymentPublicKey, "hex").slice(1, 33),
                    witnessUtxo: {
                        script: Buffer.from(btcutxo.scriptpubkey, "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        console.log("Pay finalFee =====================>", finalFee);
        if (FinalTotalBtcAmount < finalFee)
            throw "BTC balance is not enough";
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        Finalpsbt.addOutput({
            address: config_1.ADMIN_ADDRESS,
            value: serverFee,
        });
        Finalpsbt.addOutput({
            address: paymentAddress,
            value: totalBtcAmount - (finalFee + price + serverFee),
        });
        Finalpsbt.addOutput({
            address: creator.paymentAddress,
            value: price,
        });
        const tweakedChildNode = keypair.tweak(bitcoin.crypto.taggedHash("TapTweak", keypair.publicKey.subarray(1, 33)));
        console.log("Finalpsbt ============>", Finalpsbt.toHex());
        for (const input of serverInput) {
            console.log("serverInput sign ==> ", input);
            Finalpsbt.signInput(input, tweakedChildNode);
        }
        return {
            success: true,
            message: "Minting for you successfully",
            payload: {
                psbtHex: Finalpsbt.toHex(),
                psbtBase64: Finalpsbt.toBase64(),
                serverInput,
                clientInput,
            },
        };
    });
}
exports.runeMintController = runeMintController;
const transfer = (psbt, signedPSBT, walletType, inputCount, ordinalAddress, walletId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const airdropVault = yield AirdropVault_1.default.findById(walletId);
        if (!airdropVault)
            return {
                success: false,
                message: "Not Found with this id.",
                payload: null,
            };
        let sellerSignPSBT;
        const inputArray = [];
        console.log("psbt ==> ", psbt);
        console.log("signedPSBT ==> ", signedPSBT);
        console.log("inputCount ==> ", inputCount);
        for (let i = 0; i < inputCount; i++) {
            inputArray.push(i);
        }
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = bitcoinjs_lib_1.Psbt.fromBase64(signedPSBT);
            sellerSignPSBT = yield (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), inputArray);
            console.log("WalletTypes.XVERSE inputArray  ==> ", inputArray);
        }
        else {
            sellerSignPSBT = yield (0, psbt_service_1.finalizePsbtInput)(signedPSBT, inputArray);
        }
        const combineResult = yield (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        if (!combineResult)
            return {
                success: false,
                message: "Get Error",
                payload: null,
            };
        const editions = airdropVault.edition;
        if (editions.findIndex((address) => address == ordinalAddress) < 0) {
            console.log("New edition ==>");
            airdropVault.edition.push(ordinalAddress);
            yield airdropVault.save();
        }
        else {
            console.log("already saved edition ==>");
        }
        return {
            success: true,
            message: "Transaction broadcasting successfully.",
            payload: combineResult,
        };
    }
    catch (error) {
        console.log("Error : ", error);
        return {
            success: false,
            message: "Transaction broadcasting failed.",
            payload: null,
        };
    }
});
exports.transfer = transfer;
const batchTransfer = (airdropId, unitAmount, runeId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const airdropVault = yield AirdropVault_1.default.findById(airdropId);
        if (!airdropVault)
            return {
                success: false,
                message: "There is no airdropVault with this id",
                payload: null,
            };
        const { witnessScript, p2msOutput, address, threshold, cosigner, assets, edition, } = airdropVault;
        // Check Assets is in DB and valid as Rune Name
        if (!assets)
            return {
                success: false,
                message: "There is no Assets in DB",
                payload: null,
            };
        const originalName = assets === null || assets === void 0 ? void 0 : assets.runeName.replaceAll(".", "").toLocaleUpperCase();
        console.log("Original Name ==>", originalName);
        const runeIdOfAssets = yield (0, psbt_service_1.getRuneIdByName)(originalName);
        if (!runeIdOfAssets)
            return {
                success: false,
                message: "The Rune Name is invalid.",
                payload: null,
            };
        // Valid edition check
        const holderList = yield (0, unisat_service_1.fetchRuneHolderList)(runeIdOfAssets);
        if (!holderList)
            return {
                success: false,
                message: "There is holderList with this rune",
                payload: null,
            };
        const onlyHolderAddress = yield holderList.map((holder) => holder.address);
        const trueEditions = edition.filter((value) => onlyHolderAddress.includes(value));
        console.log("True Editions ==> ", trueEditions);
        const newWIFWallet = new WIFWallet_1.WIFWallet({
            networkType: config_1.TEST_MODE ? "testnet" : "mainnet",
            privateKey: config_1.WIF_KEY,
        });
        console.log("newWIFWallet ==> ", newWIFWallet);
        // Transfer
        const runeBlockNumber = parseInt(runeId.split(":")[0]);
        const runeTxout = parseInt(runeId.split(":")[1]);
        console.log("address ==> ", address);
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(address);
        const runeUtxos = yield (0, psbt_service_1.getRuneUtxoByAddress)(address, runeId);
        console.log("btcUtxos ==> ", btcUtxos);
        console.log("runeUtxos ==> ", runeUtxos);
        let tokenSum = 0;
        // const feeRate = TEST_MODE ? 300 : 15;
        const feeRate = (yield (0, psbt_service_1.getFeeRate)()) + 6;
        console.log("Initial FeeRate ==> ", feeRate);
        const transferAmount = parseInt(unitAmount) * trueEditions.length;
        const psbt = new bitcoinjs_lib_1.Psbt({ network });
        const edicts = [];
        const serverFee = 8000;
        console.log("transferAmount ==> ", transferAmount);
        // create rune utxo input && edict
        for (const runeutxo of runeUtxos.runeUtxos) {
            if (tokenSum <
                transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility)) {
                psbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    tapInternalKey: pubKeyXonly,
                    witnessUtxo: {
                        value: runeutxo.value,
                        script: newWIFWallet.output,
                    },
                });
                console.log("runeutxo.amount ==> ", runeutxo.amount);
                tokenSum += runeutxo.amount;
            }
        }
        console.log("transferAmount ==> ", transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("Rest Amount ==> ", tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("tokenSum ==> ", tokenSum);
        if (tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
            0) {
            edicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 1,
            });
            for (let i = 0; i < edition.length; i++) {
                edicts.push({
                    id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                    amount: parseInt(unitAmount) * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                    output: 2 + i,
                });
            }
        }
        else {
            for (let i = 0; i < edition.length; i++) {
                edicts.push({
                    id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                    amount: parseInt(transferAmount.toString()),
                    output: 1 + i,
                });
            }
        }
        console.log("tokenSum ==> ", tokenSum);
        console.log("transferAmount ==> ", edicts);
        const mintstone = new runelib_1.Runestone(edicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
        psbt.addOutput({
            script: mintstone.encipher(),
            value: 0,
        });
        if (tokenSum - transferAmount > 0) {
            psbt.addOutput({
                address: config_1.ADMIN_ADDRESS,
                value: 546,
            });
        }
        // add rune receiver address
        for (let i = 0; i < edition.length; i++) {
            psbt.addOutput({
                address: edition[i],
                value: 546,
            });
        }
        // const feeRate = await getFeeRate();
        console.log("feeRate ==> ", feeRate);
        // add btc utxo input
        let totalBtcAmount = 0;
        console.log("btcUtxos ==> ", btcUtxos);
        for (const btcutxo of btcUtxos) {
            const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee + serverFee + 10000 && btcutxo.value > 10000) {
                totalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    tapInternalKey: Buffer.from(newWIFWallet.publicKey, "hex").slice(1, 33),
                    witnessUtxo: {
                        script: newWIFWallet.output,
                        value: btcutxo.value,
                    },
                });
            }
        }
        const fee = (0, psbt_service_1.calculateTxFee)(psbt, feeRate);
        console.log("Pay Fee in batch transfer =====================>", fee);
        console.log("totalBtcAmount in batch transfer ====>", totalBtcAmount);
        if (totalBtcAmount < fee + serverFee)
            throw "BTC balance is not enough";
        psbt.addOutput({
            address: config_1.ADMIN_ADDRESS,
            value: serverFee,
        });
        psbt.addOutput({
            address: address,
            value: totalBtcAmount - (fee + serverFee),
        });
        const redeemPsbt = newWIFWallet.signPsbt(psbt, newWIFWallet.ecPair);
        console.log("feeRate ==> ", feeRate);
        console.log("virtual size in pre ==> ", redeemPsbt.extractTransaction(true).virtualSize() + 23);
        const finalFee = (redeemPsbt.extractTransaction(true).virtualSize() + 23) * (feeRate);
        const Finalpsbt = new bitcoinjs_lib_1.Psbt({ network });
        const FinalEdicts = [];
        const serverInput = [];
        const clientInput = [];
        let inputCount = 0;
        let FinaltokenSum = 0;
        // create rune utxo input && edict
        for (const runeutxo of runeUtxos.runeUtxos) {
            if (FinaltokenSum <
                transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility)) {
                Finalpsbt.addInput({
                    hash: runeutxo.txid,
                    index: runeutxo.vout,
                    // tapInternalKey: pubKeyXonly,
                    witnessScript: Buffer.from(witnessScript, "hex"),
                    witnessUtxo: {
                        script: Buffer.from(p2msOutput, "hex"),
                        value: runeutxo.value,
                    },
                });
                FinaltokenSum += runeutxo.amount * Math.pow(10, runeutxo.divisibility);
                serverInput.push(inputCount);
                inputCount++;
            }
        }
        console.log("transferAmount ==> ", transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("Rest Amount ==> ", FinaltokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility));
        console.log("FinaltokenSum ==> ", FinaltokenSum);
        if (tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
            0) {
            FinalEdicts.push({
                id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                amount: tokenSum - transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                output: 1,
            });
            for (let i = 0; i < edition.length; i++) {
                FinalEdicts.push({
                    id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                    amount: parseInt(unitAmount) * Math.pow(10, runeUtxos.runeUtxos[0].divisibility),
                    output: 2 + i,
                });
            }
        }
        else {
            for (let i = 0; i < edition.length; i++) {
                FinalEdicts.push({
                    id: new runelib_1.RuneId(runeBlockNumber, runeTxout),
                    amount: parseInt(transferAmount.toString()),
                    output: 1 + i,
                });
            }
        }
        console.log("FinaltokenSum ==> ", FinaltokenSum);
        console.log("transferAmount ==> ", FinalEdicts);
        const Finalmintstone = new runelib_1.Runestone(FinalEdicts, (0, runelib_1.none)(), (0, runelib_1.none)(), (0, runelib_1.none)());
        Finalpsbt.addOutput({
            script: Finalmintstone.encipher(),
            value: 0,
        });
        if (FinaltokenSum -
            transferAmount * Math.pow(10, runeUtxos.runeUtxos[0].divisibility) >
            0) {
            Finalpsbt.addOutput({
                address: address,
                value: 546,
            });
        }
        for (let i = 0; i < edition.length; i++) {
            Finalpsbt.addOutput({
                address: edition[i],
                value: 546,
            });
        }
        console.log("feeRate ==> ", feeRate);
        // add btc utxo input
        let FinalTotalBtcAmount = 0;
        for (const btcutxo of btcUtxos) {
            if (FinalTotalBtcAmount < finalFee + serverFee && btcutxo.value > 10000) {
                FinalTotalBtcAmount += btcutxo.value;
                clientInput.push(inputCount);
                inputCount++;
                Finalpsbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    // tapInternalKey: Buffer.from(newWIFWallet.publicKey, "hex").slice(1, 33),
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
                payload: null
            };
        console.log("FinalTotalBtcAmount ====>", FinalTotalBtcAmount);
        Finalpsbt.addOutput({
            address: config_1.ADMIN_ADDRESS,
            value: serverFee,
        });
        Finalpsbt.addOutput({
            address: address,
            value: totalBtcAmount - (finalFee + serverFee),
        });
        // const tweakedChildNode = keypair.tweak(
        //   bitcoin.crypto.taggedHash("TapTweak", keypair.publicKey.subarray(1, 33))
        // );
        // for (const input of serverInput) {
        //   console.log("serverInput sign ==> ", input);
        //   Finalpsbt.signInput(input, tweakedChildNode);
        // }
        console.log("Finalpsbt ============>", Finalpsbt.toHex());
        return {
            success: true,
            message: "Successfully.",
            payload: Finalpsbt.toHex(),
        };
    }
    catch (error) {
        console.log("batch transfer error ==> ", error);
        return {
            success: false,
            message: "Get error in transfer.",
            payload: error,
        };
    }
});
exports.batchTransfer = batchTransfer;
