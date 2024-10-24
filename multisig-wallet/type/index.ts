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
  scriptpubkey: string;
}

export interface IInscriptionInfo {
  inscriptionId: string;
  amount: number;
  ownerPaymentAddress: string;
  ownerOrdinalAddress: string;
}

export interface IAssets {
  runeName: string;
  runeAmount: string;
  initialPrice: string;
  runeSymbol: string;
  creatorAddress: string;
}

export const enum RequestType {
  Tranfer = "Tranfer",
  Vote = "Vote",
  VaultUpgrade = "VaultUpgrade",
  OrdinalsTransfer = "OrdinalsTransfer",
  Brc20 = "Brc20",
  Tapping = "Tapping",
  ApproveClaim = "ApproveClaim"
}

export interface IMempoolUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export interface IUtxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey: string;
}

export interface IRuneUtxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey: string;
  amount: number;
  divisibility: number;
}

export interface IUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export interface ITXSTATUS {
  confirmed: boolean;
  block_height: number;
  block_hash: string;
  block_time: number;
}

export interface IVault {
  _id: any;
  cosigner: string[];
  witnessScript: string;
  p2msOutput: string;
  address: string;
  threshold: number;
  createdAt: Date;
  assets?:
    | {
        runeName: string;
        runeAmount: string;
        initialPrice: string;
        runeSymbol: string;
        creatorAddress: string;
      }
    | null
    | undefined;
  imageUrl?: string | null | undefined;
}

export interface ITaprootVault {
  _id: any;
  cosigner: string[];
  address: string;
  threshold: number;
  createdAt: Date;
  privateKey: string;
  tapscript: string;
  assets?:
    | {
        runeName: string;
        runeAmount: string;
        initialPrice: string;
        runeSymbol: string;
        creatorAddress: string;
      }
    | null
    | undefined;
  imageUrl?: string | null | undefined;
}

export interface IAddressGroup {
  paymentAddress: string;
  paymentPublicKey: string;
  ordinalAddress: string;
  ordinalPublicKey: string;
}

export interface IholderList {
  address: string;
  amount: string;
}

export interface IParentVault {
  serverKeys: string[];
  deployer: {
    paymentAddress: string;
    paymentPublicKey: string;
    ordinalAddress: string;
    ordinalPublicKey: string;
  };

  cosigner: string[];
  witnessScript: string;
  p2msOutput: string;
  address: string;
  threshold: number;
  imageUrl: string;

  stakingParams: {
    stakableRuneId: string;
    rewardRuneId: string;
    rewardRate: string;
    liveTime: string;
    claimableMinTime: string;
  };
  childVaultList: string[];
  createdAt: string;
}

export interface ITapItemList {
  tick: string;
  amt: number;
  address: string;
}

export interface ITapBalance {
  ticker: string;
  overallBalance: string;
  transferableBalance: string;
}

export enum Status {
  Pending = "Pending",
  Ready = "Ready",
  End = "End",
}

export enum VaultType {
  NativeSegwit = "NativeSegwit",
  Taproot = "Taproot",
}
