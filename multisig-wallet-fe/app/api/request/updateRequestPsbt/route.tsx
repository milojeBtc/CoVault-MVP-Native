import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { psbt, id, pubkey } = await request.json();
    const axios = require("axios");

    console.log(
      "fetchRequestById in backend ==> ",
      `${process.env.NEXT_PUBLIC_BACKEND}/api/request/updateRequest`
    );

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/request/updateRequest`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        psbt,
        id,
        pubkey,
      }),
    };

    const response = await axios.request(config);

    return Response.json(response.data);
  } catch (error) {
    console.error("Error fetching request id", error);
    return Response.json(
      { message: "Error fetching request id" },
      { status: 409 }
    );
  }
}
