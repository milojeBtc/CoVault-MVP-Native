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
exports.sendOrdinalNS = exports.sendOrdinal = exports.createMultiSigWallet = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const bip341_1 = require("bitcoinjs-lib/src/payments/bip341");
const bip32_1 = __importDefault(require("bip32"));
const config_1 = require("../config/config");
const mutisigWallet_1 = require("../utils/mutisigWallet");
const function_1 = require("../utils/function");
const psbt_service_1 = require("../service/psbt.service");
const psbt_service_2 = require("../service/psbt.service");
const mempool_1 = require("../utils/mempool");
const psbt_service_3 = require("../service/psbt.service");
const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const ecc = require("tiny-secp256k1");
const bip32 = (0, bip32_1.default)(ecc);
const rng = require("randombytes");
const ECPair = ECPairFactory(ecc);
const network = config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin; // Otherwise, bitcoin = mainnet and regnet = local
const createMultiSigWallet = () => {
    var _a;
    try {
        const minSignCount = 1;
        const wifKeyList = [
            "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
            "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
        ];
        const pubKeyList = [
            "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
            "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
        ];
        const leafPubkeys = pubKeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
        const leafKey = bip32.fromSeed(rng(64), network);
        const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, minSignCount, leafKey.privateKey, bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        return {
            privateKey: (_a = leafKey.privateKey) === null || _a === void 0 ? void 0 : _a.toString("hex"),
            address: multiSigWallet.address,
        };
    }
    catch (error) {
        console.log(error);
    }
};
exports.createMultiSigWallet = createMultiSigWallet;
const sendOrdinal = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const minSignCount = 1;
        const wifKeyList = [
            "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
            "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
        ];
        const pubKeyList = [
            "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
            "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
        ];
        const leafPubkeys = pubKeyList.map((pubkey) => (0, bip371_1.toXOnly)(Buffer.from(pubkey, "hex")));
        const leafKey = bip32.fromSeed(rng(64), network);
        const multiSigWallet = new mutisigWallet_1.TaprootMultisigWallet(leafPubkeys, minSignCount, leafKey.privateKey, bip341_1.LEAF_VERSION_TAPSCRIPT).setNetwork(config_1.TEST_MODE ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(multiSigWallet.address);
        const psbt = new Bitcoin.Psbt({ network });
        const inscriptionData = yield (0, function_1.getInscriptionData)(multiSigWallet.address, "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0");
        multiSigWallet.addInput(psbt, inscriptionData.txid, inscriptionData.vout, inscriptionData.satoshi);
        psbt.addOutput({
            address: "tb1pss0yzfjl8akaz9a0y3z69573dgk9q7hu2vdnajrkru868u4skmwqp3vkey",
            value: inscriptionData.satoshi,
        });
        let totalBtcAmount = 0;
        const feeRate = (yield (0, mempool_1.getFeeRate)());
        let fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
        for (const btcutxo of btcUtxos) {
            fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee && btcutxo.value > 1000) {
                totalBtcAmount += btcutxo.value;
                multiSigWallet.addInput(psbt, btcutxo.txid, btcutxo.vout, btcutxo.value);
            }
        }
        fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount - fee < 0)
            return {
                success: false,
                message: "You have not enough btc for this transaction",
                payload: null,
            };
        psbt.addOutput({
            address: multiSigWallet.address,
            value: totalBtcAmount - fee - inscriptionData.satoshi,
        });
        const keyPair1 = ECPair.fromWIF(wifKeyList[0], network);
        const keyPair2 = ECPair.fromWIF(wifKeyList[1], network);
        for (let i = 0; i < psbt.inputCount; i++) {
            psbt.signInput(i, keyPair1);
        }
        multiSigWallet.addDummySigs(psbt);
        psbt.finalizeAllInputs();
        const RawTx = psbt.extractTransaction().toHex();
        const txId = yield (0, psbt_service_3.pushRawTx)(RawTx);
        return {
            success: true,
            message: "Successfully",
            payload: txId,
        };
    }
    catch (error) {
        console.log(error);
    }
});
exports.sendOrdinal = sendOrdinal;
// export const createNSMultiSigWallet = () => {
//   try {
//     const minSignCount = 1;
//     const wifKeyList: any[] = [
//       "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
//       "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
//     ];
//     const pubKeyList: string[] = [
//       "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
//       "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
//     ];
//     const hexedPubkeys = pubKeyList.map((pubkey) => Buffer.from(pubkey, "hex"));
//     const p2ms = bitcoin.payments.p2ms({
//       m: minSignCount,
//       pubkeys: hexedPubkeys,
//       network,
//     });
//     const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
//     return {
//       p2msOutput: "0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"),
//       address: p2wsh.address,
//     };
//   } catch (error) {
//     console.log(error);
//   }
// };
const sendOrdinalNS = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const minSignCount = 1;
        const wifKeyList = [
            "cNkn7K8fWmqEoj9orfzmizgXxy3gqJyneTBBDsz3Dobetx9bS42p",
            "cTKLTaJ9czvb4AgN7UxTY4uBrZu4wRpiDQyTEbmv7J9vgsQucL3p",
        ];
        const pubKeyList = [
            "0332362069574f88b2960e6c9c3491521b01ef32d913ec0f8ce6940eb89b7f7ec2",
            "03abb1b44f6526130e5b8b580b5f87f6a9668d6652ee336b282cb725be645aab6a",
        ];
        const hexedPubkeys = pubKeyList.map((pubkey) => Buffer.from(pubkey, "hex"));
        const p2ms = bitcoin.payments.p2ms({
            m: minSignCount,
            pubkeys: hexedPubkeys,
            network,
        });
        const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network });
        const btcUtxos = yield (0, psbt_service_1.getBtcUtxoByAddress)(p2wsh.address);
        const psbt = new Bitcoin.Psbt({ network });
        const inscriptionData = yield (0, function_1.getInscriptionData)(p2wsh.address, "e27c4838659659036fbdbbe869a49953d7fc65af607b160cff98736cea325b1ei0");
        psbt.addInput({
            hash: inscriptionData.txid,
            index: inscriptionData.vout,
            witnessScript: Buffer.from(p2wsh.redeem.output.toString("hex"), "hex"),
            witnessUtxo: {
                script: Buffer.from("0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"), "hex"),
                value: inscriptionData.satoshi,
            },
        });
        psbt.addOutput({
            address: "tb1pss0yzfjl8akaz9a0y3z69573dgk9q7hu2vdnajrkru868u4skmwqp3vkey",
            value: inscriptionData.satoshi,
        });
        let totalBtcAmount = 0;
        const feeRate = (yield (0, mempool_1.getFeeRate)());
        let fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
        for (const btcutxo of btcUtxos) {
            fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
            if (totalBtcAmount < fee && btcutxo.value > 1000) {
                totalBtcAmount += btcutxo.value;
                psbt.addInput({
                    hash: btcutxo.txid,
                    index: btcutxo.vout,
                    witnessScript: Buffer.from(p2wsh.redeem.output.toString("hex"), "hex"),
                    witnessUtxo: {
                        script: Buffer.from("0020" + bitcoin.crypto.sha256(p2ms.output).toString("hex"), "hex"),
                        value: btcutxo.value,
                    },
                });
            }
        }
        fee = (0, psbt_service_2.calculateTxFee)(psbt, feeRate);
        if (totalBtcAmount - fee < 0)
            return {
                success: false,
                message: "You have not enough btc for this transaction",
                payload: null,
            };
        psbt.addOutput({
            address: p2wsh.address,
            value: totalBtcAmount - fee - inscriptionData.satoshi,
        });
        const keyPair1 = ECPair.fromWIF(wifKeyList[0], network);
        const keyPair2 = ECPair.fromWIF(wifKeyList[1], network);
        for (let i = 0; i < psbt.inputCount; i++) {
            psbt.signInput(i, keyPair1);
            psbt.validateSignaturesOfInput(i, () => true);
            psbt.finalizeInput(i);
        }
        const RawTx = psbt.extractTransaction().toHex();
        const txId = yield (0, psbt_service_3.pushRawTx)(RawTx);
        return {
            success: true,
            message: "Successfully",
            payload: txId,
        };
    }
    catch (error) {
        console.log(error);
    }
});
exports.sendOrdinalNS = sendOrdinalNS;
