import { Request, Response, Router } from "express";

import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

import axios from "axios";

import {
  combinePsbt,
  generateSendBTCPSBT,
  generateSendOrdinalPSBT,
  generateRBF_PSBT,
  finalizePsbtInput,
  cancel_Tx,
} from "../../service/psbt.service";
import {
  TEST_MODE,
  WalletTypes,
  OPENAPI_UNISAT_TOKEN,
  OPENAPI_UNISAT_URL,
} from "../../config/config";
import { getFeeRate } from "../../utils/mempool";

// Create a new instance of the Express Router
const SendBtcRoute = Router();

// @route    GET api/users/username
// @desc     Is username available
// @access   Public
SendBtcRoute.post("/pre-exec", async (req, res) => {
  try {
    console.log("exec api is called!");

    const {
      buyerPayPubkey,
      buyerOrdinalAddress,
      buyerOrdinalPubkey,
      sellerPaymentAddress,
      amount,
      walletType,
    } = req.body;

    const { psbt, buyerPaymentsignIndexes } = await generateSendBTCPSBT(
      walletType,
      buyerPayPubkey,
      buyerOrdinalAddress,
      buyerOrdinalPubkey,
      sellerPaymentAddress,
      amount
    );

    console.log("=========================>");
    console.log(JSON.stringify(psbt));

    return res.status(200).json({
      success: true,
      psbtHex: psbt.toHex(),
      psbtBase64: psbt.toBase64(),
      buyerPaymentsignIndexes,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});

SendBtcRoute.post("/exec", async (req, res) => {
  console.log("exec in sendBtcRoute ==>  api is calling!!");
  try {
    const { psbt, signedPSBT, walletType } = req.body;

    const tempPsbt = Bitcoin.Psbt.fromHex(signedPSBT);
    const inputCount = tempPsbt.inputCount;
    const inputArr = Array.from({ length: inputCount }, (_, index) => index);
    console.log("inputArr in exec ==> ", inputArr);

    let sellerSignPSBT;
    if (walletType === WalletTypes.XVERSE) {
      sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
      sellerSignPSBT = finalizePsbtInput(sellerSignPSBT.toHex(), inputArr);
    } else if (walletType === WalletTypes.HIRO) {
      sellerSignPSBT = finalizePsbtInput(signedPSBT, inputArr);
    } else {
      // sellerSignPSBT = signedPSBT;
      sellerSignPSBT = finalizePsbtInput(signedPSBT, inputArr);
      const tempPsbt2 = Bitcoin.Psbt.fromHex(sellerSignPSBT);
      console.log("finalized psbt ==> ", tempPsbt2.extractTransaction(true));
      console.log("virtual size in exec ==> ", tempPsbt2.extractTransaction(true).virtualSize());
    }

    console.log("sellerSignPSBT ==> ", sellerSignPSBT);

    const txID = await combinePsbt(psbt, sellerSignPSBT);
    console.log(txID);

    return res.status(200).json({ success: true, msg: txID });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({ success: false });
  }
});

SendBtcRoute.post("/rbf", async (req, res) => {
  try {
    console.log("req.body ==> ", req.body);

    const { txId, walletType, feeRate } = req.body;

    const { psbt, buyerPaymentsignIndexes } = await generateRBF_PSBT(
      txId,
      walletType,
      feeRate
    );

    return res.status(200).json({
      success: true,
      psbtHex: psbt.toHex(),
      psbtBase64: psbt.toBase64(),
      buyerPaymentsignIndexes,
    });

    return res.json({});
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});

SendBtcRoute.post("/cancel", async (req, res) => {
  try {
    console.log("req.body ==> ", req.body);

    const { txId, walletType, feeRate } = req.body;

    const { psbt, buyerPaymentsignIndexes } = await cancel_Tx(
      txId,
      walletType,
      feeRate
    );

    return res.status(200).json({
      success: true,
      psbtHex: psbt.toHex(),
      psbtBase64: psbt.toBase64(),
      buyerPaymentsignIndexes,
    });

    return res.json({});
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});

SendBtcRoute.post("/multisign-combine", async (req, res) => {
  console.log("exec api is calling!!");
  try {
    const { psbt, signedPSBT, walletType } = req.body;

    let sellerSignPSBT;
    if (walletType === WalletTypes.XVERSE) {
      sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
      sellerSignPSBT = finalizePsbtInput(sellerSignPSBT.toHex(), [0]);
    } else sellerSignPSBT = finalizePsbtInput(signedPSBT, [0]);

    console.log("sellerSignPSBT ==> ", sellerSignPSBT);

    const txID = await combinePsbt(psbt, sellerSignPSBT);
    console.log(txID);

    return res.status(200).json({ success: true, msg: txID });
  } catch (error) {
    console.log("Buy Ticket and Combine PSBT Error : ", error);
    return res.status(500).json({ success: false });
  }
});

export default SendBtcRoute;
