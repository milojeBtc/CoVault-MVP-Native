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
exports.checkTxStatus = exports.createRuneToken = void 0;
const runelib_1 = require("runelib");
const utils_service_1 = require("../utils/utils.service");
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const localWallet_1 = require("../utils/localWallet");
const psbt_service_1 = require("../service/psbt.service");
const psbt_service_2 = require("../utils/psbt.service");
const unisat_service_1 = require("../utils/unisat.service");
const mempool_1 = require("../utils/mempool");
const RuneModal_1 = __importDefault(require("../model/RuneModal"));
const type_1 = require("../type");
Bitcoin.initEccLib(ecc);
const network = config_1.TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin;
const wallet = new localWallet_1.LocalWallet(config_1.WIF_KEY, config_1.TEST_MODE ? 1 : 0);
const dummyUtxo = [
    {
        txid: "bbca2238117d6671f40f4efe5f2c6bb111dd60b589c6e72689fcab17798e7049",
        vout: 0,
        status: {
            confirmed: true,
            block_height: 2818544,
            block_hash: "0000000000000002975bc6dfde352d035e3fc6e5240219bf55bd12c892c5184b",
            block_time: 1716981277,
        },
        value: 27750,
    },
];
const etchingRuneToken = (runeName, runeAmount, runeSymbol, initialPrice, creatorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Verify Repeatance
        const repeatedName = yield RuneModal_1.default.findOne({
            runeName,
        });
        if (repeatedName)
            return {
                success: false,
                message: "RuneName is already registered in DB",
                payload: null
            };
        const name = runeName.replaceAll(".", "•");
        const originalName = runeName.replaceAll(".", "").toLocaleUpperCase();
        const spacers = (0, runelib_1.getSpacersVal)(name);
        console.log(originalName);
        console.log(spacers);
        const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/runes/${originalName}/info`;
        const config = {
            headers: {
                Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
            },
        };
        console.log("url ==> ", url);
        const networkRepeatance = (yield axios_1.default.get(url, config)).data;
        console.log("networkRepeatance ==> ", networkRepeatance);
        if (networkRepeatance.data)
            return {
                success: false,
                message: "Already existed Rune Name",
                payload: null
            };
        const ins = new runelib_1.EtchInscription();
        const HTMLContent = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Build Your Own Recursive Ordinal</title>
      </head>
      <body style="margin: 0px">
        <div>
          ${runeName}
        </div>
      </body>
    </html>`;
        ins.setContent("text/html;charset=utf-8", Buffer.from(HTMLContent, "utf-8"));
        ins.setRune(originalName);
        const etching_script_asm = `${(0, utils_service_1.toXOnly2)(Buffer.from(wallet.pubkey, "hex")).toString("hex")} OP_CHECKSIG`;
        const etching_script = Buffer.concat([
            new Uint8Array(Bitcoin.script.fromASM(etching_script_asm)),
            new Uint8Array(ins.encipher()),
        ]);
        const scriptTree = {
            output: etching_script,
        };
        const script_p2tr = Bitcoin.payments.p2tr({
            internalPubkey: (0, utils_service_1.toXOnly2)(Buffer.from(wallet.pubkey, "hex")),
            scriptTree,
            network,
        });
        const etching_redeem = {
            output: etching_script,
            redeemVersion: 192,
        };
        const etching_p2tr = Bitcoin.payments.p2tr({
            internalPubkey: (0, utils_service_1.toXOnly2)(Buffer.from(wallet.pubkey, "hex")),
            scriptTree,
            redeem: etching_redeem,
            network,
        });
        const address = (_a = script_p2tr.address) !== null && _a !== void 0 ? _a : "";
        if (address === "") {
            console.log("Can Not Get Inscription Address");
            return {
                success: false,
                message: "Can Not Get Inscription Address",
                payload: null
            };
        }
        const feeRate = yield (0, psbt_service_1.getFeeRate)();
        const generateDummyInscribePSBT = yield (0, psbt_service_2.inscribeRunePSBT)(dummyUtxo, script_p2tr, etching_p2tr, etching_redeem, 
        //   wallet.address,
        config_1.ADMIN_ADDRESS, runeSymbol, runeAmount, originalName, spacers);
        const dummyDataVB = yield (0, psbt_service_2.finalizePsbtInput0)(generateDummyInscribePSBT.toHex());
        const calcTxFee = dummyDataVB.virtualSize() * feeRate;
        const sendBTCTxId = yield (0, unisat_service_1.sendBTC)(calcTxFee + config_1.RUNE_RECEIVE_VALUE, address);
        yield (0, utils_service_1.delay)(5000);
        const utxos = yield (0, psbt_service_2.waitUntilUTXO)(address);
        const utxo = utxos.filter((utxo) => utxo.value === calcTxFee + config_1.RUNE_RECEIVE_VALUE);
        const generateInscribePSBT = yield (0, psbt_service_2.inscribeRunePSBT)(utxo, script_p2tr, etching_p2tr, etching_redeem, config_1.ADMIN_ADDRESS, runeSymbol, runeAmount, originalName, spacers);
        const payload = {
            txId: "",
            sendBTCTxId: sendBTCTxId,
            runeName: runeName,
            runeSymbol: runeSymbol,
            initialPrice: initialPrice,
            creatorAddress: creatorAddress,
            runeid: "",
            runeAmount: runeAmount,
            remainAmount: runeAmount,
            psbt: generateInscribePSBT.toHex(),
            status: type_1.Status.Pending,
        };
        // Save
        const newRune = new RuneModal_1.default(payload);
        yield newRune.save();
        return {
            success: true,
            message: "Rune etching successfully",
            payload
        };
        ;
    }
    catch (error) {
        console.log("Error occurs while etching rune token => ", error);
        throw error;
    }
});
const createRuneToken = (runeName, runeAmount, runeSymbol, initialPrice, creatorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = yield etchingRuneToken(runeName, runeAmount, runeSymbol, initialPrice, creatorAddress);
        return payload;
    }
    catch (error) {
        console.log("While Create Rune Token => ", error);
        return {
            success: false,
            message: error,
            payload: null
        };
    }
});
exports.createRuneToken = createRuneToken;
const checkTxStatus = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("checkTxStatus ==> ");
        const runeIdList = [];
        let _cnt = 0;
        const currentBlockHeight = yield (0, mempool_1.getBlockHeight)();
        console.log("currentBlockHeight ==> ", currentBlockHeight);
        const ruenEtchingList = yield RuneModal_1.default.find({
            status: type_1.Status.Pending,
        });
        // console.log("ruenEtchingList ==> ", ruenEtchingList);
        const checkRuneEtchingList = yield Promise.all(ruenEtchingList.map((etchinglist) => (0, mempool_1.getTxStatus)(etchinglist.sendBTCTxId)));
        // console.log("checkRuneEtchingList ==> ", checkRuneEtchingList);
        for (const checkRuneEtching of checkRuneEtchingList) {
            console.log("checkRuneEtching ==> ", checkRuneEtching);
            console.log("checkRuneEtching.block_Height ==> ", checkRuneEtching.block_height);
            console.log("currentBlockHeight >= checkRuneEtching.blockHeight + 6 ==> ", currentBlockHeight >= checkRuneEtching.block_height + 6);
            if (checkRuneEtching.confirmed &&
                currentBlockHeight >= checkRuneEtching.block_height + 6) {
                console.log("<== 6 block later ==>");
                const txId = yield (0, psbt_service_2.broadcastPSBT)(ruenEtchingList[_cnt].psbt);
                const updateItem = ruenEtchingList[_cnt];
                updateItem.status = type_1.Status.Ready;
                updateItem.txId = txId;
                yield updateItem.save();
                console.log("txId ==> ", txId);
            }
            _cnt++;
        }
        console.log("Status Pending Ended ==> ");
        _cnt = 0;
        const ruenEtchingList1 = yield RuneModal_1.default.find({
            status: type_1.Status.Ready,
        });
        // console.log("ruenEtchingList1 ==> ", ruenEtchingList1);
        const checkRuneEtchingList1 = yield Promise.all(ruenEtchingList1.map((etchinglist) => (0, mempool_1.getTxStatus)(etchinglist.txId ? etchinglist.txId : "")));
        // console.log("checkRuneEtchingList1 ==> ", checkRuneEtchingList1);
        for (const checkRuneEtching1 of checkRuneEtchingList1) {
            if (checkRuneEtching1.confirmed) {
                const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/runes/utxo/${ruenEtchingList1[_cnt].txId}/1/balance`;
                console.log("url ==> ", url);
                const config = {
                    headers: {
                        Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
                    },
                };
                const res = yield axios_1.default.get(url, config);
                console.log("res.data.data[0] ==> ", res.data);
                const updateItem = ruenEtchingList1[_cnt];
                updateItem.status = type_1.Status.End;
                updateItem.runeid = res.data.data[0].runeid;
                runeIdList.push(res.data.data[0].runeid);
                yield updateItem.save();
            }
            _cnt++;
        }
        console.log("Status End Ended ==> ");
        console.log("runeIdList ==> ", runeIdList);
        return {
            success: true,
            message: "checked transaction successfully.",
            payload: runeIdList
        };
    }
    catch (error) {
        console.log("Check All Etching Tx Status : ", error);
        return {
            success: false,
            message: "Get failure while checking transaction.",
            payload: null
        };
    }
});
exports.checkTxStatus = checkTxStatus;
