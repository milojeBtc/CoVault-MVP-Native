import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    const axios = require("axios");

    console.log(
      "tap Balance List in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/get-tap-assets`
    );
    console.log("address ==> ", address);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/get-tap-assets`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        address,
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error tap Balance List: ", (error as any).response.data);
    return Response.json(
      {
        success: false,
        message: "Error tap Balance List",
        payload: null,
      },
      { status: 409 }
    );
  }
}
