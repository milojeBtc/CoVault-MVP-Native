import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const axios = require("axios");
    console.log("fetchAllRuneList in api ==> ");

    let config = {
      method: "get",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/airdropVault/fetchAllRuneList`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    console.log("config in fetchAllRuneList ==> ", config);
    const response = await axios.request(config);
    console.log("Success in fetchAllRuneList ==> ", response.data);

    return Response.json(response.data);
  } catch (error) {
    return Response.json(
      { message: "Error fetchAllRuneList to memepool" },
      { status: 409 }
    );
  }
}
