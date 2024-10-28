import {
  IAddressGroup,
  IRuneAssets,
  ITapItemList,
  ITapList,
} from "../utils/_type";
import {
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
} from "../utils/utils";
import { IWalletList } from "../utils/_type";

export const writeHistory = async (
  paymentAddress: string,
  amountToTransfer: number,
  txId: string,
  walletType: string
) => {
  try {
    const response = await fetch(`/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentAddress,
        amountToTransfer,
        txId,
        walletType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const walletConnect = async (
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string,
  walletType: string,
  hash: string
) => {
  //   try {
  //     const response = await fetch(`/api/walletConnect`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         paymentAddress,
  //         paymentPublicKey,
  //         ordinalAddress,
  //         ordinalPublicKey,
  //         walletType,
  //         hash,
  //       }),
  //     });
  //     if (response.status == 200) {
  //       const data = await response.json();
  //       return data;
  //     } else {
  //       return undefined;
  //     }
  //   } catch (error) {
  //     return undefined;
  //   }
  return {
    success: true,
  };
};

// Multisg
export const createNewVault = async (
  cosignerList: string[],
  thresHoldValue: string,
  assets?: IRuneAssets,
  imageUrl?: string,
  vaultType?: string
) => {
  try {
    const response = await fetch(`/api/multisig/createNewVault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cosignerList,
        thresHoldValue,
        assets,
        imageUrl,
        vaultType,
      }),
    });
    const data = await response.json();
    console.log("createNewVault in controller ==> ", data);
    return data;
  } catch (error) {
    return undefined;
  }
};

export const etchingRuneTokens = async (assets: IRuneAssets) => {
  try {
    const response = await fetch(`/api/multisig/etchingNewTokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assets,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchVaultController = async () => {
  try {
    const response = await fetch(`/api/multisig/fetchVaultList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // if (response.status == 200) {
    const data = await response.json();
    return data;
    // } else {
    //   return undefined;
    // }
  } catch (error) {
    return undefined;
  }
};

export const updateVault = async (
  selectedVault: IWalletList,
  cosignerList: string[],
  thresHoldValue: number,
  ordinalAddress: string,
  imageUrl: string
) => {
  try {
    const prefix = selectedVault.address.slice(2, 4);
    const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";

    const response = await fetch(`/api/multisig/updateVault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedVault,
        cosignerList,
        thresHoldValue,
        ordinalAddress,
        imageUrl,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const multisigDetailsById = async (id: string | string[]) => {
  console.log("id ==> ", id);
  try {
    const response = await fetch(`/api/multisig/multisigDetailsById`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("multisigDetailsById ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const getBtcAndRuneByAddressController = async (address: string) => {
  console.log("address ==> ", address);
  try {
    const response = await fetch(`/api/multisig/getBtcAndRuneByAddress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("getBtcAndRuneByAddress ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const btcTransferController = async (
  walletId: string,
  destination: string,
  amount: number,
  paymentAddress: string,
  ordinalAddress: string,
  vaultType: string
) => {
  console.log("walletId ==> ", walletId);
  console.log("destination ==> ", destination);
  console.log("amount ==> ", amount);
  console.log("paymentAddress ==> ", paymentAddress);
  console.log("ordinalAddress ==> ", ordinalAddress);
  console.log("vaultType ==> ", vaultType);

  try {
    const response = await fetch(`/api/multisig/sendBtc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        destination,
        amount,
        paymentAddress,
        ordinalAddress,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("btcTransferController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const runeTransferController = async (
  vaultId: string,
  destination: string,
  runeId: string,
  amount: number,
  ordinalAddress: string,
  ordinalPublicKey: string,
  vaultType: string
) => {
  console.log("<======= runeTransferController =======> ");

  console.log("vaultId ==> ", vaultId);
  console.log("destination ==> ", destination);
  console.log("runeId ==> ", runeId);
  console.log("amount ==> ", amount);
  console.log("ordinalAddress ==> ", ordinalAddress);
  console.log("ordinalPublicKey ==> ", ordinalPublicKey);
  console.log("vaultType ==> ", vaultType);

  try {
    const response = await fetch(`/api/multisig/sendRune`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId,
        destination,
        runeId,
        amount,
        ordinalAddress,
        ordinalPublicKey,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("rune TransferController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const brc20InscribingController = async (
  multisigId: string,
  multisigAddress: string,
  address: string,
  ticker: string,
  amount: number,
  paymentAddress: string,
  paymentPublicKey: string
) => {
  console.log("<======= brc20InscribingController =======> ");

  console.log("multisigId ==> ", multisigId);
  console.log("multisigAddress ==> ", multisigAddress);
  console.log("address ==> ", address);
  console.log("ticker ==> ", ticker);
  console.log("amount ==> ", amount);
  console.log("paymentAddress ==> ", paymentAddress);
  console.log("paymentPublicKey ==> ", paymentPublicKey);

  try {
    const response = await fetch(`/api/multisig/brc20Inscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        multisigId,
        multisigAddress,
        address,
        ticker,
        amount,
        paymentAddress,
        paymentPublicKey,
      }),
    });
    console.log("response ==> ", response);
    if (response.status == 200) {
      const data = await response.json();
      console.log("brc20 TransferController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const brc20TransferController = async (
  vaultId: string,
  inscriptionId: string,
  destination: string,
  ticker: string,
  amount: number,
  paymentAddress: string,
  ordinalAddress: string,
  vaultType: string
) => {
  try {
    const response = await fetch(`/api/multisig/brc20Transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId,
        inscriptionId,
        destination,
        ticker,
        amount,
        paymentAddress,
        ordinalAddress,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("brc20Transfer Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("brc20Transfer Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("brc20Transfer error ==> ", error);
    return [];
  }
};

export const getTransferableInscription = async (
  address: string,
  ticker: string,
  amount: number
) => {
  console.log("<======= getTransferableInscription =======> ");

  console.log("address ==> ", address);
  console.log("ticker ==> ", ticker);
  console.log("amount ==> ", amount);

  try {
    const response = await fetch(`/api/multisig/getTransferInscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        ticker,
        amount,
      }),
    });
    console.log("getTransferableInscription response ==> ", response);
    if (response.status == 200) {
      const data = await response.json();
      console.log("getTransferInscription ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

// End

// Request
export const createRequestController = async (
  psbt: string,
  signedPsbt: string,
  vaultId: string,
  ticker: string,
  amount: number,
  destination: string,
  creator: string,
  paymentPublicKey: string
) => {
  try {
    const response = await fetch(`/api/request/createBtcRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psbt,
        signedPsbt,
        vaultId,
        ticker,
        amount,
        destination,
        creator,
        paymentPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("createBtcRequest ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchRequestListController = async () => {
  try {
    const response = await fetch(`/api/request/fetchAllRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchRequestListController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchRequestPsbtController = async (
  requestId: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/request/fetchPsbtById`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchPsbtById Controller ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const updateRequestPsbtController = async (
  psbt: string,
  id: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/request/updateRequestPsbt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psbt,
        id,
        pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("updateRequestPsbt Controller ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const cancelRequestPsbtController = async (
  id: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/request/canceRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelUpdateForRequest Controller ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};
// End

// Airdrop vault
export const createNewAirdropVault = async (
  cosignerList: string[],
  thresHoldValue: string,
  creator: IAddressGroup,
  assets?: IRuneAssets,
  imageUrl?: string
) => {
  try {
    const response = await fetch(`/api/airdrop/createNewAirdropVault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cosignerList,
        thresHoldValue,
        assets,
        creator,
        imageUrl,
      }),
    });
    const data = await response.json();
    console.log("createNewAirdropVault in controller ==> ", data);
    return data;
  } catch (error) {
    return undefined;
  }
};

export const fetchAirdropWalletsController = async () => {
  try {
    const response = await fetch(`/api/airdrop/fetchAirdropList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const mintAirdropController = async (
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string,
  walletId: string
) => {
  try {
    const response = await fetch(`/api/airdrop/mintAirdrop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentAddress,
        paymentPublicKey,
        ordinalAddress,
        ordinalPublicKey,
        walletId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("mintAirdropController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const broadcastingController = async (
  psbt: string,
  signedPsbt: string,
  walletType: string,
  inputsCount: number,
  ordinalAddress: string,
  walletId: string
) => {
  try {
    const response = await fetch(`/api/airdrop/broadcasting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psbt,
        signedPsbt,
        walletType,
        inputsCount,
        ordinalAddress,
        walletId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("broadcastingController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchRuneListByAddressController = async (
  walletAddress: string
) => {
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${walletAddress}/runes/balance-list?start=0&limit=500`;
    console.log("url in fetchRuneListByAddressController ==> ", url);
    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    const axios = require("axios");
    const runeList = (await axios.get(url, config)).data;
    return runeList.data.detail;
  } catch (error) {
    return [];
  }
};

export const batchTransferController = async (
  airdropId: string,
  unitAmount: number,
  runeId: string
) => {
  try {
    const response = await fetch(`/api/airdrop/batchTransfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airdropId,
        unitAmount,
        runeId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("batchTransferController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const execPsbt = async (
  psbt: string,
  signedPSBT: string,
  walletType: string
) => {
  try {
    const response = await fetch(`/api/utils/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psbt,
        signedPSBT,
        walletType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("execPsbt ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

// marketplace vault
export const marketplaceListController = async (
  sellerOrdinalAddress: string,
  sellerOrdinalPubkey: string,
  sellerPaymentAddress: string,
  sellerPaymentPubkey: string,
  runeTicker: string,
  sellPrice: string,
  imageUrl: string
) => {
  console.log("sellerOrdinalAddress ==> ", sellerOrdinalAddress);
  console.log("sellerOrdinalPubkey ==> ", sellerOrdinalPubkey);
  console.log("sellerPaymentAddress ==> ", sellerPaymentAddress);
  console.log("sellerPaymentPubkey ==> ", sellerPaymentPubkey);
  console.log("runeId ==> ", runeTicker);
  console.log("sellPrice ==> ", sellPrice);
  console.log("imageUrl ==> ", imageUrl);

  try {
    const response = await fetch(`/api/marketplace/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerOrdinalAddress,
        sellerOrdinalPubkey,
        sellerPaymentAddress,
        sellerPaymentPubkey,
        runeTicker,
        sellPrice,
        imageUrl,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("execPsbt ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const pre_buyListController = async (
  listId: string,
  buyerOrdinalAddress: string,
  buyerOrdinalPubkey: string,
  buyerPaymentAddress: string,
  buyerPaymentPubkey: string
) => {
  try {
    const response = await fetch(`/api/marketplace/pre_buyList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        buyerPaymentAddress,
        buyerPaymentPubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("pre_buyListController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const ready_buyListController = async (
  listId: string,
  buyerOrdinalAddress: string,
  buyerOrdinalPubkey: string,
  buyerPaymentAddress: string,
  buyerPaymentPubkey: string,
  psbt: string,
  inputsArray: string
) => {
  try {
    const response = await fetch(`/api/marketplace/ready_buyList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        buyerPaymentAddress,
        buyerPaymentPubkey,
        psbt,
        inputsArray,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("ready_buyListController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchListController = async () => {
  try {
    const response = await fetch(`/api/marketplace/syndicateFetchList`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchListController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const cancelMarketplceController = async (
  marketplaceId: string,
  buyerOrdinalsAddress: string
) => {
  try {
    const response = await fetch(`/api/marketplace/cancelRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplaceId,
        buyerOrdinalsAddress,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelMarketplceController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const acceptMarketplceController = async (
  marketplaceId: string,
  sellerOrdinalAddress: string,
  psbt: string,
  signedPSBT: string,
  walletType: string
) => {
  try {
    const response = await fetch(`/api/marketplace/acceptRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplaceId,
        sellerOrdinalAddress,
        psbt,
        signedPSBT,
        walletType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelMarketplceController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

// Syndicate vault
export const createNewSyndicateVault = async (
  cosignerList: string[],
  thresHoldValue: string,
  creator: IAddressGroup,
  assets?: IRuneAssets,
  imageUrl?: string
) => {
  try {
    console.log("cosignerList ==> ", cosignerList);
    console.log("thresHoldValue ==> ", thresHoldValue);
    console.log("assets ==> ", assets);
    console.log("imageUrl ==> ", imageUrl);
    if (
      !cosignerList.length ||
      !thresHoldValue ||
      !creator ||
      !assets ||
      !imageUrl
    )
      return {
        sucess: false,
        message: "One of the input is missing or incorrect for response.",
        payload: null,
      };
    const response = await fetch(`/api/syndicate/createNewVault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cosignerList,
        thresHoldValue,
        assets,
        creator,
        imageUrl,
      }),
    });
    const data = await response.json();
    console.log("createNewSyndicateVault in controller ==> ", data);
    return data;
  } catch (error) {
    return undefined;
  }
};

export const fetchSyndicateWalletsController = async () => {
  try {
    const response = await fetch(`/api/syndicate/fetchSyndicateList`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const mintSyndicateController = async (
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string,
  walletId: string
) => {
  try {
    const response = await fetch(`/api/syndicate/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentAddress,
        paymentPublicKey,
        ordinalAddress,
        ordinalPublicKey,
        walletId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("mintSyndicateController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const broadcastingSyndicateController = async (
  psbt: string,
  signedPsbt: string,
  walletType: string,
  inputsCount: number,
  ordinalAddress: string,
  walletId: string
) => {
  try {
    const response = await fetch(`/api/syndicate/broadcasting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        psbt,
        signedPsbt,
        walletType,
        inputsCount,
        ordinalAddress,
        walletId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("broadcastingController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const batchSyndicateTransferController = async (
  airdropId: string,
  unitAmount: number,
  runeId: string,
  ordinalPublicKey: string
) => {
  try {
    const response = await fetch(`/api/syndicate/batchTransfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        airdropId,
        unitAmount,
        runeId,
        ordinalPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("batchTransferController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const updateSyndicateRequest = async (
  syndicateId: string,
  signedPSBT: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/syndicate/updateRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: syndicateId,
        psbt: signedPSBT,
        pubkey: pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("execPsbt ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchSyndicateRequestController = async () => {
  try {
    console.log("fetchSyndicateRequestController called ==> ");
    const response = await fetch(`/api/syndicate/fetchAllSyndicateRequest`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchSyndicateRequestController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchSyndicateRequestPsbtController = async (
  requestId: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/syndicate/fetchRequestPsbtById`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchPsbtById Controller ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const cancelSyndicateRequestPsbtController = async (
  id: string,
  pubkey: string
) => {
  try {
    const response = await fetch(`/api/syndicate/canceRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        pubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelUpdateForRequest Controller ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const fetchParentListController = async (
  ordinalAddress: string,
  ordinalPublicKey: string,
  paymentAddress: string,
  paymentPublicKey: string
) => {
  try {
    const response = await fetch(`/api/staking/fetchParentList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ordinalAddress,
        ordinalPublicKey,
        paymentAddress,
        paymentPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchParentList Controller ==> ", data);
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.log("fetchParentListController error ==> ", error);
    return [];
  }
};

// Syndicate
export const marketplaceSyndicateListController = async (
  sellerOrdinalAddress: string,
  sellerOrdinalPubkey: string,
  sellerPaymentAddress: string,
  sellerPaymentPubkey: string,
  runeTicker: string,
  sellPrice: string,
  imageUrl: string
) => {
  console.log("sellerOrdinalAddress ==> ", sellerOrdinalAddress);
  console.log("sellerOrdinalPubkey ==> ", sellerOrdinalPubkey);
  console.log("sellerPaymentAddress ==> ", sellerPaymentAddress);
  console.log("sellerPaymentPubkey ==> ", sellerPaymentPubkey);
  console.log("runeId ==> ", runeTicker);
  console.log("sellPrice ==> ", sellPrice);
  console.log("imageUrl ==> ", imageUrl);

  try {
    const response = await fetch(`/api/marketplace/syndicateList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerOrdinalAddress,
        sellerOrdinalPubkey,
        sellerPaymentAddress,
        sellerPaymentPubkey,
        runeTicker,
        sellPrice,
        imageUrl,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("execPsbt ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const pre_buySyndicateListController = async (
  listId: string,
  buyerOrdinalAddress: string,
  buyerOrdinalPubkey: string,
  buyerPaymentAddress: string,
  buyerPaymentPubkey: string
) => {
  try {
    const response = await fetch(`/api/marketplace/syndicate-pre-buyList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        buyerPaymentAddress,
        buyerPaymentPubkey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("syndicate-pre-buyList ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const cancelSyndicateMarketplceController = async (
  marketplaceId: string,
  buyerOrdinalsAddress: string
) => {
  try {
    const response = await fetch(`/api/marketplace/cancelRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplaceId,
        buyerOrdinalsAddress,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelMarketplceController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const acceptSyndicateMarketplceController = async (
  marketplaceId: string,
  sellerOrdinalAddress: string,
  psbt: string,
  signedPSBT: string,
  walletType: string
) => {
  try {
    const response = await fetch(`/api/marketplace/acceptSyndicateRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplaceId,
        sellerOrdinalAddress,
        psbt,
        signedPSBT,
        walletType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("cancelMarketplceController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};

export const ready_buySyndicateListController = async (
  listId: string,
  buyerOrdinalAddress: string,
  buyerOrdinalPubkey: string,
  buyerPaymentAddress: string,
  buyerPaymentPubkey: string,
  psbt: string,
  inputsArray: string
) => {
  try {
    const response = await fetch(`/api/marketplace/syndicate_ready_buyList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        buyerPaymentAddress,
        buyerPaymentPubkey,
        psbt,
        inputsArray,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("syndicate_ready_buyListController ==> ", data);
      return data;
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
};
// End syndicate

// Staking Vault
export const createParentStakingVaultController = async (
  claimableMinTime: string,
  rewardRate: string,
  rewardRuneId: string,
  stakableRuneId: string,
  imageUrl: string,
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string
) => {
  try {
    const response = await fetch(`/api/staking/createParentVault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimableMinTime,
        rewardRate,
        rewardRuneId,
        stakableRuneId,
        imageUrl,
        paymentAddress,
        paymentPublicKey,
        ordinalAddress,
        ordinalPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("createParentStakingVaultController Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("createParentStakingVaultController Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("createParentStakingVaultController error ==> ", error);
    return [];
  }
};

export const fetchUserBalanceController = async (
  runeId: string,
  ordinalAddress: string
) => {
  console.log("runeId ==> ", runeId);
  console.log("ordinalAddress ==> ", ordinalAddress);
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${ordinalAddress}/runes/${runeId}/balance`;
    console.log("url in fetchUserBalanceController ==> ", url);
    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    const axios = require("axios");
    const runeList = (await axios.get(url, config)).data;
    console.log("runeList ==> ", runeList.data);
    return runeList.data.amount;
  } catch (error) {
    console.log("fetchUserBalanceController error ==> ", error);
    return 0;
  }
};

export const stakingController = async (
  parentId: string,
  stakingAmount: number,
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string
) => {
  try {
    const response = await fetch(`/api/staking/preStake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        stakingAmount,
        paymentAddress,
        paymentPublicKey,
        ordinalAddress,
        ordinalPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("pre-stake Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("pre-stake Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("pre-stake error ==> ", error);
    return [];
  }
};

export const stakingBroadcastingController = async (
  signedPsbt: string,
  stakingListId: string
) => {
  try {
    const response = await fetch(`/api/staking/stake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedPsbt,
        stakingListId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("stake Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("stake Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("stake error ==> ", error);
    return [];
  }
};

export const claimController = async (
  parentId: string,
  rewardAddress: string,
  paymentAddress: string,
  paymentPublicKey: string,
  ordinalAddress: string,
  ordinalPublicKey: string
) => {
  try {
    const response = await fetch(`/api/staking/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        rewardAddress,
        paymentAddress,
        paymentPublicKey,
        ordinalAddress,
        ordinalPublicKey,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("claim Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("claim Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("claim error ==> ", error);
    return [];
  }
};

export const fetchClaimRequestListController = async (
  parentId: string | string[]
) => {
  try {
    const response = await fetch(`/api/staking/fetchClaimRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchClaimRequest Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("fetchClaimRequest Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("fetchClaimRequest error ==> ", error);
    return [];
  }
};

export const fetchVaultDetailsController = async (
  parentId: string | string[]
) => {
  try {
    const response = await fetch(`/api/staking/fetchVaultDetails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("fetchVaultDetails Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("fetchVaultDetails Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("fetchVaultDetails error ==> ", error);
    return [];
  }
};

export const approveClaimRequestController = async (
  parentId: string | string[]
) => {
  try {
    const response = await fetch(`/api/staking/approveClaimRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("approveClaimRequest Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("approveClaimRequest Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("approveClaimRequest error ==> ", error);
    return [];
  }
};

export const claimApproveBroadcastingController = async (
  parentId: string | string[],
  childIdList: string[],
  psbt: string
) => {
  try {
    const response = await fetch(`/api/staking/approveBroadcasting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId,
        childIdList,
        psbt,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("approveClaimRequest Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("approveClaimRequest Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("approveClaimRequest error ==> ", error);
    return [];
  }
};
// End Staking Vault

// Ordinals Transfer
export const ordinalTransferController = async (
  vaultId: string,
  destination: string,
  inscriptionId: string,
  paymentAddress: string,
  ordinalAddress: string,
  vaultType: string
) => {
  try {
    const response = await fetch(`/api/multisig/ordinalsTransfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId,
        destination,
        inscriptionId,
        paymentAddress,
        ordinalAddress,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("ordinalsTransfer Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("ordinalsTransfer Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("ordinalsTransfer error ==> ", error);
    return [];
  }
};
// End

// Tap
export const getTapBalanceByAddressController = async (address: string) => {
  try {
    const response = await fetch(`/api/multisig/tapBalanceList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("getTapBalanceByAddressController Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("getTapBalanceByAddressController Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("getTapBalanceByAddressController error ==> ", error);
    return [];
  }
};

export const preTapInscribeController = async (
  paymentAddress: string,
  paymentPublicKey: string,
  itemList: ITapItemList[],
  walletType: string
) => {
  try {
    const response = await fetch(`/api/multisig/preTapInscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentAddress,
        paymentPublicKey,
        itemList,
        walletType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("preTapInscribe Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("preTapInscribe Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("preTapInscribe error ==> ", error);
    return [];
  }
};

export const tapInscribeController = async (
  receiveAddress: string,
  privateKey: string,
  amount: string,
  hexedPsbt: string,
  signedHexedPsbt: string,
  itemList: ITapItemList[]
) => {
  try {
    const response = await fetch(`/api/multisig/tapInscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiveAddress,
        privateKey,
        amount,
        hexedPsbt,
        signedHexedPsbt,
        itemList,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("tapInscribe Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("tapInscribe Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("tapInscribe error ==> ", error);
    return [];
  }
};

export const tapOrdinalTransferController = async (
  vaultId: string,
  inscriptionId: string,
  paymentAddress: string,
  ordinalAddress: string,
  vaultType: string
) => {
  try {
    const response = await fetch(`/api/multisig/sendTapInscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultId,
        inscriptionId,
        paymentAddress,
        ordinalAddress,
        vaultType,
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("tapOrdinalTransferController Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("tapOrdinalTransferController Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("tapOrdinalTransferController error ==> ", error);
    return [];
  }
};
// End Tap

export const usdToBtcController = async (amount: number) => {
  try {
    const response = await fetch(`/api/utils/getBtcPrice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("usdToBtcController Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("usdToBtcController Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("usdToBtcController error ==> ", error);
    return [];
  }
};

export const getFeeLevelController = async (address: string) => {
  try {
    const response = await fetch(`/api/utils/getFeeLevel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address
      }),
    });
    if (response.status == 200) {
      const data = await response.json();
      console.log("getFeeLevelController Controller ==> ", data);
      return data;
    } else {
      const data = await response.json();
      console.log("getFeeLevelController Controller ==> ", data);
      return data;
    }
  } catch (error) {
    console.log("usdToBtcController error ==> ", error);
    return [];
  }
};
