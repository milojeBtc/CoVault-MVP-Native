"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_FEE_PERCENT = exports.RUNE_WIF_KEY = exports.WIF_KEY = exports.SERVICE_FEE_ADDRESS = exports.ADMIN_ADDRESS = exports.FEE_ADDRESS = exports.WalletTypes = exports.DAO_RUNE_TICKER_ID = exports.SERVICE_FEE_VIP = exports.SERVICE_FEE = exports.RUNE_RECEIVE_VALUE = exports.ADMIN_PAYMENT_ADDRESS = exports.SERVICE_FEE_PERCENT = exports.COSIGNATURE_SIZE = exports.SIGNATURE_SIZE = exports.OPENAPI_UNISAT_TOKEN = exports.CURRENT_BITCOIN_PRICE_URL = exports.ORDINAL_URL = exports.TRAC_NETWORK_API = exports.MEMPOOL_URL = exports.OPENAPI_URL = exports.OPENAPI_UNISAT_URL = exports.MEMPOOL_API = exports.MONGO_URL = exports.TEST_MODE = exports.JWT_SECRET = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
try {
    dotenv_1.default.config();
}
catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}
exports.PORT = process.env.PORT || 9020;
exports.JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
exports.TEST_MODE = true;
exports.MONGO_URL = exports.TEST_MODE
    ? `mongodb+srv://toskypi1016:Zjlf8P7TbhS2oy89@cluster0.qyg4xxl.mongodb.net/Multisig`
    : `mongodb+srv://michalstefanowmarek:0QmtMFAXiHVKEVAi@cluster0.7emwb.mongodb.net/`;
exports.MEMPOOL_API = exports.TEST_MODE
    ? "https://mempool.space/testnet/api"
    : "https://mempool.space/api";
exports.OPENAPI_UNISAT_URL = exports.TEST_MODE
    ? "https://open-api-testnet.unisat.io"
    : "https://open-api.unisat.io";
exports.OPENAPI_URL = exports.TEST_MODE
    ? "https://api-testnet.unisat.io/wallet-v4"
    : "https://api.unisat.io/wallet-v4";
exports.MEMPOOL_URL = exports.TEST_MODE
    ? "https://mempool.space/testnet/api"
    : "https://ordinalgenesis.mempool.space/api";
exports.TRAC_NETWORK_API = exports.TEST_MODE
    ? "http://testtap.covault.xyz"
    : "http://tap.covault.xyz";
exports.ORDINAL_URL = exports.TEST_MODE
    ? "https://static-testnet.unisat.io/content"
    : "https://static.unisat.io/content";
exports.CURRENT_BITCOIN_PRICE_URL = "https://api.coindesk.com/v1/bpi/currentprice.json";
exports.OPENAPI_UNISAT_TOKEN = "50c50d3a720f82a3b93f164ff76989364bd49565b378b5c6a145c79251ee7672";
exports.SIGNATURE_SIZE = 126;
exports.COSIGNATURE_SIZE = 47;
exports.SERVICE_FEE_PERCENT = 3;
exports.ADMIN_PAYMENT_ADDRESS = process.env
    .ADMIN_PAYMENT_ADDRESS;
exports.RUNE_RECEIVE_VALUE = 546;
exports.SERVICE_FEE = 3;
exports.SERVICE_FEE_VIP = 1;
exports.DAO_RUNE_TICKER_ID = "COVAULT•VAULT•ONE";
var WalletTypes;
(function (WalletTypes) {
    WalletTypes["UNISAT"] = "Unisat";
    WalletTypes["XVERSE"] = "Xverse";
    WalletTypes["HIRO"] = "Hiro";
    WalletTypes["OKX"] = "Okx";
})(WalletTypes || (exports.WalletTypes = WalletTypes = {}));
exports.FEE_ADDRESS = exports.TEST_MODE
    ? "tb1p2upq7g0mvawdmlvm0w873758y972e7h5dq9jq5t6ux7n9k0yakes7dgenk"
    : "bc1p2upq7g0mvawdmlvm0w873758y972e7h5dq9jq5t6ux7n9k0yakesf97kfe";
exports.ADMIN_ADDRESS = exports.TEST_MODE
    ? "tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"
    : "bc1ptwm68plqn6laqev89ftvzl38kngtg2zhl8c4ndshf5m7efs6sgkqq708d8";
exports.SERVICE_FEE_ADDRESS = exports.TEST_MODE
    ? "tb1pm5xmwqstu2fhcf2566xur059d5jg80s80uq9qj6hjz46f8lzne0qusrr7x"
    : "bc1ptwm68plqn6laqev89ftvzl38kngtg2zhl8c4ndshf5m7efs6sgkqq708d8";
exports.WIF_KEY = exports.TEST_MODE
    ? "cUpP2sL3WGuZhF4LKEQxfQGUqgC1MdByV9mw2Luek6enxWPqnSaH"
    : "L4iMoD9hEyu5r9SFzbnTGMF7GRQEgtzqFa5t6TuToz15mP95Hza2";
exports.RUNE_WIF_KEY = exports.TEST_MODE
    ? "cPfH4h3TTryoBA5gmXKBrf3Jkea4mg512fvTwHSwgS4zDGZDZD6h"
    : "L4iMoD9hEyu5r9SFzbnTGMF7GRQEgtzqFa5t6TuToz15mP95Hza2";
exports.SERVER_FEE_PERCENT = 0.02;
// export const OPENAPI_UNISAT_TOKEN = process.env.UNISAT_TOKEN;
// export const OPENAPI_UNISAT_TOKEN2 = process.env.UNISAT_TOKEN2;
