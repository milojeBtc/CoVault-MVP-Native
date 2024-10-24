import {
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
  TEST_MODE,
} from "@/app/utils/utils";
import { NextRequest } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch a inscriptions using wallet address
export async function POST(request: NextRequest) {
  try {
    const { address, ticker, amount, paymentAddress, paymentPublicKey } =
      await request.json();

    const axios = require("axios");

    let existedInscription;

    while (1) {
      await delay(12000);

      // Check transferable inscription
      const url2 = `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/brc20/${ticker}/transferable-inscriptions`;
      console.log("url2 ==> ", url2);
      console.log("amount ==> ", amount);
      const config2 = {
        headers: {
          Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
        },
      };
      const inscriptionList: any[] = (await axios.get(url2, config2)).data.data
        .detail;
      existedInscription = inscriptionList.find(
        (inscription) =>
          inscription.data.tick.toUpperCase() == ticker.toUpperCase() &&
          inscription.data.amt == amount
      );

      console.log("existedInscription ==> ", existedInscription);
      console.log("inscriptionList ==> ", inscriptionList);

      if(existedInscription) {
        console.log("Finally existedInscription ==> ", existedInscription);
        break;
      }
    }

    return Response.json(existedInscription.inscriptionId);
  } catch (error) {
    console.log("error ==> ", error);
    return Response.json("");
  }
}
