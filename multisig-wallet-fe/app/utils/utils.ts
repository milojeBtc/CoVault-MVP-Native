export enum WalletTypes {
  UNISAT = "Unisat",
  XVERSE = "Xverse",
  HIRO = "Hiro",
  OKX = "Okx",
  MAGICEDEN ="Magic eden"
}

export const SIGN_MESSAGE = 'Welcome to Co-vault!';
export const TEST_MODE = false;

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

export const OPENAPI_UNISAT_TOKEN =
  "50c50d3a720f82a3b93f164ff76989364bd49565b378b5c6a145c79251ee7672";

export const ORDINAL_URL = TEST_MODE ? "https://static-testnet.unisat.io/content" : "https://static.unisat.io/content";

export interface INewVault {
  address: string,
  p2msOutput: string,
  witnessScript: string
}

export type Account = {
  address: string;
  publicKey: string;
  purpose: Purpose;
};

export interface IWalletList {
  _id: string,
  cosigner: string[],
  witnessScript: string,
  p2msOutput: string,
  address: string,
  threshold: number,
  assets: {
    runeName: string,
    runeAmount: string,
    initialPrice: string,
    runeSymbol: string,
    creatorAddress: string,
  },
  imageUrl: string,
  createdAt: string
}

export interface IAirdropWalletList {
  _id: string,
  cosigner: string[],
  witnessScript: string,
  p2msOutput: string,
  address: string,
  threshold: number,
  edition: string[],
  creator: {
    paymentAddress: string,
    paymentPublicKey: string,
    ordinalAddress: string,
    ordinalPublicKey: string
  },
  assets: {
    runeName: string,
    runeAmount: string,
    initialPrice: string,
    runeSymbol: string,
    creatorAddress: string,
  },
  imageUrl: string,
  createdAt: string
}

export interface ISyndicateWalletList {
  _id: string,
  cosigner: string[],
  witnessScript: string,
  p2msOutput: string,
  address: string,
  threshold: number,
  edition: string[],
  creator: {
    paymentAddress: string,
    paymentPublicKey: string,
    ordinalAddress: string,
    ordinalPublicKey: string
  },
  assets: {
    runeName: string,
    runeAmount: string,
    initialPrice: string,
    runeSymbol: string,
    creatorAddress: string,
  },
  imageUrl: string,
  createdAt: string
}

export interface IRequest {
  assets: {
    tokenAmount: number,
    tokenName: string,
    tokenType: string
  },
  createdAt: Date,
  creator: string,
  destinationAddress: string,
  musigId: string,
  pending: string,
  psbt: string[],
  cosigner: string[],
  signedCosigner: string[],
  threshold: number,
  transferAmount: string,
  type: string,
  _id: string
}

export type Purpose = 'payment' | 'ordinals';
export const BatchTypes = {
  Ready: "Ready",
  Airdrop: "Airdrop",
  Syndicate: "Syndicate",
} 