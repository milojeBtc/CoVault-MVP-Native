import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    const axios = require("axios");

    console.log("multisigDetailsById in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/getOne`);
    console.log("id ==> ", id);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/getOne`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({ id })
    };

    const response = await axios.request(config);
    return Response.json(response.data);
    // return Response.json("ok")
  } catch (error) {
    console.error("Error multisigDetailsById Musig: ", (error as any).response.data);
    return Response.json({ 
      success: false, 
      message: "Error multisigDetailsById Musig",
      payload: null
    }, { status: 409 });
  }
}
