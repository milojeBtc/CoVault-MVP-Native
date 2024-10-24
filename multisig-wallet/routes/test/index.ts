import { Request, Response, Router } from "express";
import {
  checkTxStatus,
  createRuneToken,
} from "../../controller/rune.controller";
import { broadcastPSBT } from "../../utils/psbt.service";
import { createMultiSigWallet, sendOrdinal, sendOrdinalNS } from "../../controller/test1";

const testRoute = Router();

// @route    GET api/users/username
// @desc     Is username available
// @access   Public

testRoute.post("/broadcasting", async (req, res, next) => {
  try {
    const { psbt } = req.body;
    const result = await broadcastPSBT(psbt);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

testRoute.post("/etch-token", async (req, res, next) => {
  try {
    const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } =
      req.body;
    const result = await createRuneToken(
      runeName,
      runeAmount,
      runeSymbol,
      initialPrice,
      creatorAddress
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

testRoute.get("/create-ordinal-test-wallet", async (req, res, next) => {
  try {
    const result = await createMultiSigWallet();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

testRoute.get("/send-ordinal", async (req, res, next) => {
  try {
    const result = await sendOrdinal();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

testRoute.get("/send-ordinal-ns", async (req, res, next) => {
  try {
    const result = await sendOrdinalNS();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default testRoute;
