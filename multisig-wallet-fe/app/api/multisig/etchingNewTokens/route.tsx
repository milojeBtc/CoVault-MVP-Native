import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { assets } = await request.json();
    const axios = require("axios");

    console.log("assets in etching New Tokens ==> ", assets)

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/etchingNewTokens`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        assets
      }),
    };

    console.log("config in etchingNewTokens ==> ", assets);
    const response = await axios.request(config);

    return Response.json(response.data.payload);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error ethcing new tokens: ", (error as any).response.data);
    return Response.json({ message: "Error ethcing new tokens" }, { status: 409 });
  }
}
