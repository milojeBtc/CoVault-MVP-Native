import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { walletId, destination, amount, paymentAddress, pubKey, vaultType } = await request.json();
    const axios = require("axios");

    console.log(
      "btcTransferController in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/sendBtc`
    );
    console.log("walletId ==> ", walletId);
    console.log("destination ==> ", destination);
    console.log("amount ==> ", amount);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/sendBtc`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        walletId, destination, amount, paymentAddress, pubKey, vaultType
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error(
      "Error sendBtc Musig: ",
      (error as any).response.data
    );
    return Response.json(
      {
        success: false,
        message: "Error sendBtc Musig",
        payload: null,
      },
      { status: 409 }
    );
  }
}
