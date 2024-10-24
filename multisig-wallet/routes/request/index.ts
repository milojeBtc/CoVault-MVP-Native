import { Request, Response, Router } from "express";
import { validate, getAddressInfo } from "bitcoin-address-validation";
import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TEST_MODE, WalletTypes } from "../../config/config";

import RequestModal from "../../model/RequestModal";
import {
  cancelUpdateForRequest,
  getAllRequestList,
  getOneRequestList,
  getPsbtFromRequest,
  test,
  updateRequest,
} from "../../controller/request.controller";
import { combinePsbt, finalizePsbtInput } from "../../service/psbt.service";

// Create a new instance of the Express Router
const requestRouter = Router();

requestRouter.get("/getAllRequestList", async (req, res) => {
  const allList = await getAllRequestList();
  return res.status(200).send({
    success: true,
    message: allList?.length
      ? "Fetch all request successfully. "
      : "No request found.",
    payload: allList,
  });
});

requestRouter.post("/getOneRequestList", async (req, res) => {
  const { requestId } = req.body;

  const list = await getOneRequestList(requestId);
  return res.status(200).send({
    success: true,
    message: list ? "Fetch request successfully. " : "Not found.",
    payload: list,
  });
});

requestRouter.post("/getPsbtFromRequest", async (req, res) => {
  try {
    const { id, pubkey } = req.body;
    console.log("getPsbtFromRequest req.body ==>", req.body);
    if (!id || !pubkey)
      return res.status(400).send({
        success: false,
        message: "Id or pubkey is missing.",
        payload: null,
      });

    const response = await getPsbtFromRequest(id, pubkey);
    return res.status(200).send(response);
  } catch (error) {
    return {
      success: false,
      message: "Something error is happening.",
      payload: null,
    };
  }
});

requestRouter.post("/updateRequest", async (req, res) => {
  try {
    const { psbt, id, pubkey } = req.body;
    console.log("updateRequest req.body ==>", req.body);
    if (!id || !pubkey || !psbt)
      return res.status(400).send({
        success: false,
        message: "Id, pubkey or psbt is missing.",
        payload: null,
      });

    const response = await updateRequest(id, psbt, pubkey);
    return res.status(200).send(response);
  } catch (error) {
    return {
      success: false,
      message: "Something error is happening.",
      payload: null,
    };
  }
});

requestRouter.post("/cancelUpdateForRequest", async (req, res) => {
  try {
    const { id, pubkey } = req.body;
    console.log("cancelUpdateForRequest req.body ==>", req.body);
    if (!id || !pubkey)
      return res.status(400).send({
        success: false,
        message: "Id or pubkey is missing.",
        payload: null,
      });

    const response = await cancelUpdateForRequest(id, pubkey);
    return res.status(200).send(response);
  } catch (error) {}
  return {
    success: false,
    message: "Something error is happening.",
    payload: null,
  };
});

requestRouter.post("/exec", async (req, res) => {
  console.log("request exec api is calling!!");
  try {
    const { id } = req.body;
    const requestData = await RequestModal.findById(id);
    if (!requestData)
      return {
        success: false,
        message: "There is no request with this id",
        payload: null,
      };

    const psbtList = requestData.psbt;
    console.log("psbtList ==> ", psbtList);
    const psbt = psbtList[0];
    const signedPSBT = psbtList[psbtList.length - 1];

    console.log("psbt ==> ", psbt);
    console.log("signedPSBT ==> ", signedPSBT);

    let sellerSignPSBT;
    sellerSignPSBT = finalizePsbtInput(signedPSBT, [0]);

    const txID = await combinePsbt(psbt, sellerSignPSBT);
    console.log(txID);

    return res.status(200).json({
      success: true,
      message: "Transaction broadcasting successfully.",
      payload: txID,
    });
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({ success: false });
  }
});

requestRouter.get("/test", async (req, res) => {
  try {
    const response = await test();
    return res.status(200).send(response);
  } catch (error) {
    return {
      success: false,
      message: "Something error is happening.",
      payload: null,
    };
  }
});

export default requestRouter;
