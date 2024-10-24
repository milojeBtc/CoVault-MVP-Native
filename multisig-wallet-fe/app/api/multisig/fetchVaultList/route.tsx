import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const axios = require("axios");

    console.log("fetchVaultList in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/fetchVaultList`);

    let config = {
      method: "get",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/fetchVaultList`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    const response = await axios.request(config);

    return Response.json(response.data);
  } catch (error) {
    console.error("Error fetchVaultList: ", (error as any).response.data);
    return Response.json({ message: "Error fetchVaultList" }, { status: 409 });
  }
}
