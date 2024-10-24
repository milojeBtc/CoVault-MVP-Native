import { Request, Response, Router } from "express";
import { checkTxStatus, createRuneToken } from "../../controller/rune.controller";

const runeRoute = Router();

// @route    GET api/rune/etch-token
// @desc     etch rune token
// @access   Public

runeRoute.post("/etch-token", async (req, res, next) => {
  try {
    const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } = req.body;
    const result = await createRuneToken(runeName, runeAmount, runeSymbol, initialPrice, creatorAddress);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// @route    GET api/rune/tx-check
// @desc     rune transaction check in cycle timeline
// @access   Public

runeRoute.get("/tx-check", async(req, res, next) => {
  try {
    return res.status(200).send(await checkTxStatus());
  } catch (error) {
    return res.status(200).send('Tx check failed');
  }
})

export default runeRoute;
