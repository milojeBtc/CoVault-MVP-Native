export type OrdinalProps = {
  id: number;
  owner: string;
  inscriptionId: string;
  name: string;
  img?: string;
  tickets: number;
  leftTickets: number;
};

export type RaffleProps = {
  _id: string;
  createTime: number;
  created_at: string;
  creatorOrdinalAddress: string;
  creatorPaymentAddress: string;
  endTime: number;
  ordinalInscription: string;
  status: number;
  ticketAmounts: number;
  ticketList: string[];
  ticketPrice: number;
  updated_at: string;
  walletType: string;
  winner: string;
};

export interface IErr {
  cosigner: string;
  thresHold: string;
}

export interface IErr2 {
  stakableRuneIdErr: string;
  rewardRateRefErr: string;
  rewardRuneIdErr: string;
  claimableMinTimeErr: string;
}

export interface IRuneAssets {
  runeName: string;
  runeAmount: string;
  initialPrice: string;
  runeSymbol: string;
  creatorAddress: string;
}

export interface IAddressGroup {
  paymentAddress: string;
  paymentPublicKey: string;
  ordinalAddress: string;
  ordinalPublicKey: string;
}

export interface ISelectOption {
  value: number;
  label: string;
  id?: string;
}

export interface IRuneDetail {
  rune: string;
  runeid: string;
  spacedRune: string;
  amount: string;
  symbol: string;
  divisibility: 0;
}

export interface IAddressPair {
  ordinalAddress: string;
  ordinalPublicKey: string;
  paymentAddress: string;
  paymentPublicKey: string;
}

export interface IList {
  _id: string;
  parentAddress: string;
  buyerInfo: IAddressPair;
  sellerInfo: IAddressPair;
  runeTicker: string;
  runeId: string;
  sellPrice: string;
  psbt: string;
  status: string;
  createdAt: string;
  inputsArray: number[];
  imageUrl: string;
}

export interface IMultisig {
  _id: string;
  cosigner: string[];
  witnessScript: string;
  p2msOutput: string;
  address: string;
  threshold: number;
  assets: IRuneAssets;
  createdAt: string;
  imageUrl: string;
}

export interface IParentList {
  id: string;
  address: string;
  childList: IChildList[];
  claimRequest: IClaimRequest[];
  claimableMinTime: string;
  deployer: string;
  remainReward: number;
  rewardRate: string;
  rewardRuneId: string;
  stakableRuneId: string;
  lastClaimedTime: string;
}

export interface IClaimRequest {
  childId: string;
  claimed: boolean;
  createdAt: string;
  parentId: string;
  requestAddress: string;
  rewardAddress: string;
  rewardAmount: number,
  _id: string;
}

export interface IChildList {
  ordinalAddress: string;
  ordinalPublicKey: string;
  paymentAddress: string;
  paymentPublicKey: string;
}

export interface IOrdinalsList {
  inscriptionNumber: number;
  inscriptionId: string;
}

export interface IBrc20List {
  ticker: string;
  amount: string;
}

export interface ITapList {
  ticker: string;
  overallBalance: string;
  transferableBalance: string;
}

export interface ITapItemList {
  tick: string;
  amt: string;
  address: string;
}
