import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { psbt, signedPsbt, vaultId, ticker, amount, destination, creator } =
      await request.json();
    const axios = require("axios");

    console.log(
      "createBtcRequest in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/request/createBtcRequest`
    );

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/request/createBtcRequest`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        psbt,
        signedPsbt,
        vaultId,
        ticker,
        amount,
        destination,
        creator,
      }),
    };

    const response = await axios.request(config);

    return Response.json(response.data.payload);
  } catch (error) {
    console.error("Error createBtcRequest", (error as any).response.data);
    return Response.json(
      { message: "Error createBtcRequest" },
      { status: 409 }
    );
  }
}
