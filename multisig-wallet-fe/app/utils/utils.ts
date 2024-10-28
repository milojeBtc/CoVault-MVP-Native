export const SIGN_MESSAGE = "Welcome to Co-vault!";
export const TEST_MODE = true;

export const MEMPOOL_API = TEST_MODE
  ? "https://mempool.space/testnet/api"
  : "https://mempool.space/api";

export const OPENAPI_UNISAT_URL = TEST_MODE
  ? "https://open-api-testnet.unisat.io"
  : "https://open-api.unisat.io";

export const OPENAPI_URL = TEST_MODE
  ? "https://api-testnet.unisat.io/wallet-v4"
  : "https://api.unisat.io/wallet-v4";

export const MEMPOOL_URL = TEST_MODE
  ? "https://mempool.space/testnet/api"
  : "https://ordinalgenesis.mempool.space/api";

export const OPENAPI_UNISAT_TOKEN = TEST_MODE
  ? "45070ab4743ad4cded2769c41731ffe8b9f73cc29ea9981fcd1cad12eef9772b"
  : "b81accb393efe5663a3115f949f39413d7c054ef4be0b5071ccb37364e3cde70";

export const ORDINAL_URL = TEST_MODE
  ? "https://static-testnet.unisat.io/content"
  : "https://static.unisat.io/content";

export const CURRENT_BITCOIN_PRICE_URL = "https://api.coindesk.com/v1/bpi/currentprice.json";