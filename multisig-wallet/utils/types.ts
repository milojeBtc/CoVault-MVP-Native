export interface IStakingResult {
  user: string;
  count: bigint;
  stakedAmount: bigint;
  time: bigint;
  period: bigint;
}

export interface IAddress {
  walletName: String;
  paymentAddress: string;
  paymentPubkey: string;
  ordinalsAddress: string;
  ordinalsPubkey: string;
}

export interface IProfile {
  username: string;
  avatar: string;
  address: IAddress[];
  points: Number;
}

export interface IUtxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey?: string;
}

export interface IUtxoBalance {
  amount: string;
  runeid: string;
  rune: string;
  spacedRune: string;
  symbol: string;
  divisibility: number;
}

export enum WalletTypes {
  UNISAT = "Unisat",
  XVERSE = "Xverse",
  HIRO = "Hiro",
  OKX = "Okx",
}

export enum TokenTypes {
  Brc20 = "brc20",
  Rune = "Rune",
}
