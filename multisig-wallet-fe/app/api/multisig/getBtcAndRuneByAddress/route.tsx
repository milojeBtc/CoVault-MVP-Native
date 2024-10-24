import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    const axios = require("axios");

    console.log("getBtcAndRuneByAddress in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/getBtcAndRuneByAddress`);
    console.log("address ==> ", address);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/getBtcAndRuneByAddress`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({ address })
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error getBtcAndRuneByAddress Musig: ", (error as any).response.data);
    return Response.json({ 
      success: false, 
      message: "Error getBtcAndRuneByAddress Musig",
      payload: null
    }, { status: 409 });
  }
}
