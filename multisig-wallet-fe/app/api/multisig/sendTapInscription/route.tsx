import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { vaultId, inscriptionId, paymentAddress, ordinalAddress, vaultType } =
      await request.json();
    const axios = require("axios");

    console.log(
      "send-tap-ordinals-ns in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-tap-ordinals-ns`
    );

    let url = "";

    if(vaultType == "NativeSegwit") {
      url = `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-tap-ordinals-ns`;
    } else {
      url = `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/send-tap-ordinals-taproot`;
    }

    let config = {
      method: "post",
      url: url,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        vaultId, inscriptionId, paymentAddress, ordinalAddress
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
  } catch (error) {
    // console.error(
    //   "Error ordinalsTransfer: ",
    //   (error as any).response.data
    // );
    return Response.json(
      {
        success: false,
        message: (error as any).response.data,
        payload: null,
      },
    );
  }
}
