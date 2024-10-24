import axios from "axios";
import { IUtxo, IUtxoBalance, TokenTypes } from "./types";

import {
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  TEST_MODE,
} from "../config/config";
import { delay } from "./utils.service";

// Get BTC UTXO
export const getUTXOByAddress = async (address: string) => {
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/utxo-data`;

    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };

    let cursor = 0;
    const size = 5000;
    const utxos: IUtxo[] = [];

    console.log("here!");

    while (1) {
      console.log("url ==> ", url);
      const res = await axios.get(url, { ...config, params: { cursor, size } });

      console.log("res.data ==> ", res.data);
      if (res.data.code === -1) throw new Error("Invalid Address");

      utxos.push(
        ...(res.data.data.utxo as any[]).map((utxo) => {
          return {
            scriptpubkey: utxo.scriptPk,
            txid: utxo.txid,
            value: utxo.satoshi,
            vout: utxo.vout,
          };
        })
      );

      cursor += res.data.data.utxo.length;

      if (cursor === res.data.data.total) break;
    }

    return utxos;
  } catch (error: any) {
    console.log(error.data);
    throw new Error("Network is disconnected!!");
  }
};

export const getRuneByIDandAddress = async (
  address: string,
  runeId: string
) => {
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/${runeId}/balance`;

    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };

    let cursor = 0;
    const size = 5000;
    console.log("url ==> ", url);
    const res = await axios.get(url, { ...config, params: { cursor, size } });

    console.log("res.data ==> ", res.data);
    if (res.data.code === -1) throw new Error("Invalid Address");

    return res.data.data.utxo;
  } catch (error: any) {
    console.log(error.data);
    throw new Error("Network is disconnected!!");
  }
};

export const getRuneAmountByIDandAddress = async (
  address: string,
  runeId: string
) => {
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/${runeId}/balance`;

    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };

    let cursor = 0;
    const size = 5000;
    console.log("url ==> ", url);
    const res = await axios.get(url, { ...config, params: { cursor, size } });

    console.log("res.data ==> ", res.data);
    if (res.data.code === -1) return 0;
    if (res.data.data === null) return 0;

    return res.data.data.amount;
  } catch (error: any) {
    console.log("error in fetching rune by address and id ==> ", error);
    return 0;
  }
};

export const getTxHexById = async (txId: string) => {
  try {
    const { data } = await axios.get(
      `https://mempool.space/${TEST_MODE ? "testnet/" : ""}api/tx/${txId}/hex`
    );

    return data as string;
  } catch (error) {
    console.log("Mempool api error. Can not get transaction hex");

    throw "Mempool api is not working now. Try again later";
  }
};

export const pushRawTx = async (rawTx: string) => {
  const txid = await postData(
    `https://mempool.space/${TEST_MODE ? "testnet/" : ""}api/tx`,
    rawTx
  );
  console.log("pushed txid", txid);
  return txid;
};

const postData = async (
  url: string,
  json: any,
  content_type = "text/plain",
  apikey = ""
) => {
  while (1) {
    try {
      const headers: any = {};

      if (content_type) headers["Content-Type"] = content_type;

      if (apikey) headers["X-Api-Key"] = apikey;
      const res = await axios.post(url, json, {
        headers,
      });

      return res.data;
    } catch (err: any) {
      const axiosErr = err;
      console.log("push tx error", axiosErr.response?.data);

      if (
        !(axiosErr.response?.data).includes(
          'sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'
        )
      )
        throw new Error("Got an err when push tx");
    }
  }
};

export const checkingAssets = async (
  ordinalAddress: string,
  tokenName: string,
  tokenAmount: number
) => {
  const config = {
    headers: {
      Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
    },
  };

  // if(tokenType == TokenTypes.Brc20){
  //     const url = `https://open-api-testnet.unisat.io/v1/indexer/address/${ordinalAddress}/brc20/${tokenName}/info`;
  //     const payload = await axios.get(url, config);
  //     const privileage = payload.data.data.availableBalance;

  //     if(privileage >= tokenAmount) return true
  //     else return false

  // } else if(tokenType == TokenTypes.Rune) {
  const url = TEST_MODE ? `https://open-api-testnet.unisat.io/v1/indexer/address/${ordinalAddress}/runes/${tokenName}/balance` : `https://open-api.unisat.io/v1/indexer/address/${ordinalAddress}/runes/${tokenName}/balance`;
  const payload = await axios.get(url, config);
  const privileage = payload.data.data.amount;

  if (privileage >= tokenAmount) return true;
  else return false;
  // }
};

export const getInscriptionData = async (
  address: string,
  inscriptionId: string
) => {
  try {
    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/inscription-data`;

    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    const res = await axios.get(url, { ...config });
    const filterInscription = res.data.data.inscription.find(
      (inscription: any) => inscription.inscriptionId === inscriptionId
    );

    if(!filterInscription) {
      console.log("First Attempt get failed, Try second attempt. ==> ", filterInscription);
      await delay(30000)
      const res2 = await axios.get(url, { ...config });
      const filterInscription2 = res2.data.data.inscription.find(
        (inscription: any) => inscription.inscriptionId === inscriptionId
      );
      if(!filterInscription2) {
        console.log("Second Attempt get failed, Try third attempt. ==>", filterInscription2);
        await delay(30000)
        const res3 = await axios.get(url, { ...config });
        const filterInscriptio3 = res3.data.data.inscription.find(
          (inscription: any) => inscription.inscriptionId === inscriptionId
        );
        if(!filterInscriptio3) {
          console.log("Third Attempt get failed, Try fourth attempt. ==>", filterInscriptio3);
          await delay(40000)
          const res4 = await axios.get(url, { ...config });
          const filterInscriptio4 = res4.data.data.inscription.find(
            (inscription: any) => inscription.inscriptionId === inscriptionId
          );
          return filterInscriptio4.utxo;
        }
        return filterInscriptio3.utxo;
      }
      return filterInscription2.utxo;
    }

    return filterInscription.utxo;
  } catch (error: any) {
    console.log(error.data);
    throw new Error("Can not fetch Inscriptions!!");
  }
};
