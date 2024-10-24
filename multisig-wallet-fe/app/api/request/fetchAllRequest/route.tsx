import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const axios = require("axios");

    console.log("fetchAllRequest in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/request/getAllRequestList`);

    let config = {
      method: "get",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/request/getAllRequestList`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    const response = await axios.request(config);

    return Response.json(response.data.payload);
  } catch (error) {
    console.error("Error FEtching All Request: ", (error as any).response.data);
    return Response.json({ message: "Error FEtching All Request" }, { status: 409 });
  }
}
