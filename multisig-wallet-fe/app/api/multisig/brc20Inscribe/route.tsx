import {
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  TEST_MODE,
} from "@/app/utils/utils";
import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { multisigId, multisigAddress, address, ticker, amount, paymentAddress, paymentPublicKey } =
      await request.json();

    const axios = require("axios");

    // Checking exist inscription.
    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/checking-brc20-request`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        multisigId,
        address,
        ticker,
        amount,
        paymentAddress,
        paymentPublicKey,
      }),
    };

    const checkingResponse = await axios.request(config);
    console.log("checkingResponse ==> ", checkingResponse.data);
    // End checking

    // Make the ordier for inscribe
    if (checkingResponse.data.payload) {
      return Response.json({
        success: false,
        message: "You already made this request, plz check request tab.",
        payload: checkingResponse.payload,
      });
    }

    // Check transferable inscription
    const url2 = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${multisigAddress}/brc20/${ticker}/transferable-inscriptions`;
    const config2 = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    const inscriptionList: any[] = (await axios.get(url2, config2)).data.data
      .detail;

    console.log("inscriptionList ==> ", inscriptionList);
    const existedInscription = inscriptionList.find(
      (inscription) =>
        inscription.data.tick == ticker.toUpperCase() &&
        inscription.data.amt == amount
    );

    console.log("existedInscription ==> ", existedInscription);

    if (existedInscription)
      return Response.json({
        success: false,
        message: "You already have transferable inscription.",
        payload: existedInscription.inscriptionId,
      });
    // End check transferable inscription

    // Make the order
    const feeRate = (
      await axios.get(
        `https://mempool.space/${
          TEST_MODE ? "testnet/" : ""
        }api/v1/fees/recommended`
      )
    ).data.fastestFee + 20;
    console.log("feeRate ==> ", feeRate);

    const url = `${OPENAPI_UNISAT_URL}/v2/inscribe/order/create/brc20-transfer`;
    console.log("order details ==> ", {
      receiveAddress: multisigAddress,
      feeRate,
      outputValue: 546,
      devAddress: multisigAddress,
      devFee: 0,
      brc20Ticker: ticker,
      brc20Amount: amount,
    })

    const response = await axios.post(
      url,
      {
        receiveAddress: multisigAddress,
        feeRate,
        outputValue: 546,
        devAddress: multisigAddress,
        devFee: 0,
        brc20Ticker: ticker,
        brc20Amount: amount,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
        },
      }
    );
    console.log("response ==> ", response.data);
    const result = {
      success: true,
      message: "The request is created successfully.",
      payload: response.data,
    };
    return Response.json(result);
  } catch (error) {
    console.log("error ==> ", error);
    return Response.json(
      {
        success: false,
        message: "Error brc20 Transfer",
        payload: null,
      },
      { status: 409 }
    );
  }
}
