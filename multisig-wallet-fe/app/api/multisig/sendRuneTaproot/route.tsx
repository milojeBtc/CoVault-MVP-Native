import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const {
      vaultId,
      destination,
      runeId,
      amount,
      ordinalAddress,
      ordinalPublicKey,
    } = await request.json();
    const axios = require("axios");

    console.log(
      "btcTransferController in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/sendRune`
    );
    console.log("walletId ==> ", vaultId);
    console.log("destination ==> ", destination);
    console.log("runeId ==> ", runeId);
    console.log("amount ==> ", amount);
    console.log("ordinalAddress ==> ", ordinalAddress);
    console.log("ordinalPublicKey ==> ", ordinalPublicKey);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/sendRune`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        vaultId,
        destination,
        runeId,
        amount,
        ordinalAddress,
        ordinalPublicKey,
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error sendBtc Musig: ", (error as any).response.data);
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
