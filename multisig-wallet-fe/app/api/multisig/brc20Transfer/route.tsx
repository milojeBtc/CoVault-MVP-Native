import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const {
      vaultId,
      inscriptionId,
      destination,
      ticker,
      amount,
      paymentAddress,
      vaultType,
    } = await request.json();
    const axios = require("axios");

    console.log(
      "brc20Transfer in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-brc20-ns(taproot)`
    );

    let url = "";

    if (vaultType == "NativeSegwit") {
      url = `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-brc20-ns`;
    } else {
      url = `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-brc20-taproot`;
    }

    let config = {
      method: "post",
      url: url,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        vaultId,
        inscriptionId,
        destination,
        ticker,
        amount,
        paymentAddress,
        vaultType,
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
  } catch (error) {
    return Response.json({
      success: false,
      message: (error as any).response.data,
      payload: null,
    });
  }
}
