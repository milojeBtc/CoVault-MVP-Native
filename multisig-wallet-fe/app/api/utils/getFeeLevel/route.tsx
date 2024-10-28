import { DEPLOY_FEE } from "@/app/utils/constant";
import { DAO_RUNE_TICKER_ID } from "@/app/utils/serverAddress";
import {
  CURRENT_BITCOIN_PRICE_URL,
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  TEST_MODE,
} from "@/app/utils/utils";
import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    const axios = require("axios");
    console.log("address ==> ", address);

    const url = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/runes/${DAO_RUNE_TICKER_ID}/balance`;
    console.log("url ==> ", url);

    const config = {
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };
    const payload = (await axios.get(url, config)).data;
    const code = payload.code;
    const data = payload.data;

    console.log("code ==> ", code);
    console.log("data ==> ", data);

    if (code || !data) return Response.json(false);

    return Response.json(true); 
  
  } catch (error) {
    console.log("getFeeLevel ==> ", error);
    return Response.json(
      { message: "Error get current btc price" },
      { status: 409 }
    );
  }
}
