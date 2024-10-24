import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { psbt, signedPSBT, walletType } = await request.json();
    const axios = require("axios");

    console.log("exec in api ==> ", psbt, signedPSBT, walletType);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/sendBTC/exec`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        psbt,
        signedPSBT,
        walletType,
      }),
    };

    console.log("config in sendBTC exec ==> ", config);
    const response = await axios.request(config);
    console.log("Success in push tx ==> ", response.data);

    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    return Response.json(
      { message: "Error push tx to memepool" },
      { status: 409 }
    );
  }
}
