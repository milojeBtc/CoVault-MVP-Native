import { CURRENT_BITCOIN_PRICE_URL } from "@/app/utils/utils";
import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    const axios = require("axios");
    console.log("get current btc price in api ==> ", amount);

    let config = {
      method: "get",
      url: `${CURRENT_BITCOIN_PRICE_URL}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    console.log("get current btc price ==> ", config);
    const response = await axios.request(config);
    const btcPrice = response.data.bpi.USD.rate_float;
    console.log("Success in get current btc price ==> ", btcPrice);

    const usdToBtcPrice = Math.ceil(amount * Math.pow(10, 8) / btcPrice);
    console.log("usdToBtcPrice ==> ", usdToBtcPrice)

    return Response.json(usdToBtcPrice);
  } catch (error) {
    return Response.json(
      { message: "Error get current btc price" },
      { status: 409 }
    );
  }
}
