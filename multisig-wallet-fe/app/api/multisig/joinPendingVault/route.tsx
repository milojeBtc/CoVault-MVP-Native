import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const {
      ordinalAddress,
      ordinalPubkey,
      paymentAddress,
      paymentPubkey,
      pendingVaultId
    } = await request.json();

    const axios = require("axios");
    console.log("join pending vault in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/join-pending-vault`);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/join-pending-vault`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        ordinalAddress,
        ordinalPubkey,
        paymentAddress,
        paymentPubkey,
        pendingVaultId,
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
  } catch (error) {
    console.error("Error join pending vault in backend : ", (error as any).response.data);
    return Response.json({
      success: false,
      message: "Error join pending vault in backend ",
      payload: null
    }, { status: 409 });
  }
}
