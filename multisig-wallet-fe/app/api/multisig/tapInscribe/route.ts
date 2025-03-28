import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { receiveAddress, privateKey, amount, hexedPsbt, signedHexedPsbt, itemList } = await request.json();
    const axios = require("axios");

    console.log(
      "tap-inscribe in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/tap-inscribe`
    );
    console.log("receiveAddress ==> ", receiveAddress);
    console.log("privateKey ==> ", privateKey);
    console.log("amount ==> ", amount);
    console.log("hexedPsbt ==> ", hexedPsbt);
    console.log("signedHexedPsbt ==> ", signedHexedPsbt);
    console.log("itemList ==> ", itemList);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/tap-inscribe`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        receiveAddress,
        privateKey,
        amount,
        hexedPsbt,
        signedHexedPsbt,
        itemList
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error tap-inscribe: ", (error as any).response.data);
    return Response.json(
      {
        success: false,
        message: "Error tap-inscribe",
        payload: null,
      },
      { status: 409 }
    );
  }
}
