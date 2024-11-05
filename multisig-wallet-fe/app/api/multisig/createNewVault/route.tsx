import { NextRequest } from "next/server";
import qs from "qs";

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { vaultName, cosignerList, thresHoldValue, assets, imageUrl, vaultType, walletName, ordinalsAddress, ordinalsPubkey, paymentAddress, paymentPubkey } = await request.json();
    const axios = require("axios");

    console.log("createNativeSegwit in backend ==> ", `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/create-pending-vault`);
    console.log("cosignerList ==> ", cosignerList);
    console.log("thresHoldValue ==> ", thresHoldValue);

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/multisig/create-pending-vault`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        vaultName,
        addressList: cosignerList,
        minSignCount: thresHoldValue,
        assets,
        imageUrl,
        vaultType,
        creator: {
          walletName,
          ordinalsAddress,
          ordinalsPubkey,
          paymentAddress,
          paymentPubkey,
        }
      }),
    };

    const response = await axios.request(config);
    return Response.json(response.data);
  } catch (error) {
    console.error("Error creating new Native segwit Musig: ", (error as any).response.data);
    return Response.json({ 
      success: false, 
      message: "Error creating new Native segwit Musig",
      payload: null
    }, { status: 409 });
  }
}
