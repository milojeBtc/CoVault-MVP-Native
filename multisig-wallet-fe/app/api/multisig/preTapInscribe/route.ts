import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { paymentAddress, paymentPublicKey, itemList } = await request.json();
    const axios = require("axios");

    console.log(
      "pre-tap-inscribe in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/pre-tap-inscribe`
    );
    console.log("itemList ==> ", itemList);
    console.log("paymentAddress ==> ", paymentAddress);
    console.log("paymentPublicKey ==> ", paymentPublicKey);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/pre-tap-inscribe`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        paymentAddress,
        paymentPublicKey,
        itemList,
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error pre-tap-inscribe: ", (error as any).response.data);
    return Response.json(
      {
        success: false,
        message: "Error pre-tap-inscribe",
        payload: null,
      },
      { status: 409 }
    );
  }
}
