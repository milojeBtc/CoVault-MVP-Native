import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const PORT = process.env.PORT || 9040;
export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

export const TEST_MODE = false;
export const MONGO_URL = 

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

export const TRAC_NETWORK_API = TEST_MODE
  ? "http://testtap.covault.xyz"
  : "http://tap.covault.xyz";

export const ORDINAL_URL = TEST_MODE
  ? "https://static-testnet.unisat.io/content"
  : "https://static.unisat.io/content";

export const CURRENT_BITCOIN_PRICE_URL = "https://api.coindesk.com/v1/bpi/currentprice.json";

export const OPENAPI_UNISAT_TOKEN =
  "50c50d3a720f82a3b93f164ff76989364bd49565b378b5c6a145c79251ee7672";
export const SIGNATURE_SIZE = 126;
export const COSIGNATURE_SIZE = 47;
export const SERVICE_FEE_PERCENT = 3;
export const ADMIN_PAYMENT_ADDRESS: string = process.env
  .ADMIN_PAYMENT_ADDRESS as string;
export const RUNE_RECEIVE_VALUE = 546;
export const SERVICE_FEE = 3;
export const SERVICE_FEE_VIP = 1;
export const DAO_RUNE_TICKER_ID = "COVAULT•VAULT•ONE";
export enum WalletTypes {
  UNISAT = "Unisat",
  XVERSE = "Xverse",
  HIRO = "Hiro",
  OKX = "Okx",
}
export const FEE_ADDRESS = TEST_MODE
  ? "tb1p2upq7g0mvawdmlvm0w873758y972e7h5dq9jq5t6ux7n9k0yakes7dgenk"
  : "bc1p2upq7g0mvawdmlvm0w873758y972e7h5dq9jq5t6ux7n9k0yakesf97kfe";
export const ADMIN_ADDRESS = TEST_MODE
  ? "tb1pcngsk49thk8e5m2ndfqv9sycltrjr4rx0prwhwr22mujl99y6szqw2kv0f"
  : "bc1ptwm68plqn6laqev89ftvzl38kngtg2zhl8c4ndshf5m7efs6sgkqq708d8";
export const SERVICE_FEE_ADDRESS = TEST_MODE
  ? "tb1pm5xmwqstu2fhcf2566xur059d5jg80s80uq9qj6hjz46f8lzne0qusrr7x"
  : "bc1ptwm68plqn6laqev89ftvzl38kngtg2zhl8c4ndshf5m7efs6sgkqq708d8";

export const WIF_KEY = 

export const RUNE_WIF_KEY = 

export const SERVER_FEE_PERCENT = 0.02;
// export const OPENAPI_UNISAT_TOKEN = process.env.UNISAT_TOKEN;
// export const OPENAPI_UNISAT_TOKEN2 = process.env.UNISAT_TOKEN2;
