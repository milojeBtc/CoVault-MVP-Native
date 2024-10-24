import { Router } from "express";
import * as Bitcoin from "bitcoinjs-lib";
import { TEST_MODE } from "../../config/config";

import {
  createNativeSegwit,
  fetchTapBalanceList,
  getBtcAndRuneByAddressController,
  getInscribe,
  inscribeText,
  loadOneMusigWallets,
  makeRequest,
  reCreateNativeSegwit,
  sendbrc20Controller,
  sendBtcController,
  sendOrdinalsController,
  sendRuneController,
  sendTapOrdinalsController,
  transferAllAssets,
} from "../../controller/nativeMusig.controller";

import { loadAllMusigWallets } from "../../controller/nativeMusig.controller";
import MultisigModal from "../../model/Multisig";
import { createRuneToken } from "../../controller/rune.controller";
import {
  broadcastPSBT,
  createTaprootMultisig,
  reCreateTaprootMultisig,
  sendBrc20Taproot,
  sendBtcTaproot,
  sendOrdinalTaproot,
  sendRuneTaproot,
  sendTapOrdinalTaproot,
  transferAllTaprootAssets,
} from "../../controller/taproot.controller";
import TaprootMultisigModal from "../../model/TaprootMultisig";
import { VaultType } from "../../type";
import { checkingBrc20Request } from "../../controller/request.controller";

// Create a new instance of the Express Router
const multiSigWalletRoute = Router();

multiSigWalletRoute.post("/create-vault", async (req, res) => {
  try {
    console.log("create-nativeSegwit api is called!!");
    console.log(req.body);
    const { pubKeyList, minSignCount, assets, imageUrl, vaultType } = req.body;

    let error = "";

    if (!pubKeyList.length) error += "There is no publicKey value.";
    if (!minSignCount) error += "There is no minSignCount value.";
    if (!imageUrl) error += "There is no imageUrl value.";
    if (!vaultType) error += "There is no vaultType value.";
    if (minSignCount > pubKeyList.length)
      error += "minSignCount should be less than pubkey list count";

    if (error) {
      console.log("input error ==> ", error);
      return res.status(400).send({
        success: false,
        message: error,
        payload: null,
      });
    }

    if (vaultType == VaultType.NativeSegwit) {
      // Create new vault.
      const payload = await createNativeSegwit(
        pubKeyList,
        minSignCount,
        assets,
        TEST_MODE ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin,
        imageUrl
      );

      console.log("payload after createNativeSegwit ==> ", payload);

      if (!payload.success)
        return res.status(200).send({
          success: payload.success,
          message: payload.message,
          payload: {
            vault: null,
            rune: null,
          },
        });

      console.log("Created new vault successfully!!");
      if (assets.runeName == "None")
        return res.status(200).send({
          success: payload.success,
          message: payload.message,
          payload: {
            vault: payload,
            rune: null,
          },
        });
      // Etching new rune tokens
      const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } =
        assets;
      const result = await createRuneToken(
        runeName,
        runeAmount,
        runeSymbol,
        initialPrice,
        creatorAddress
      );
      console.log("Finished etching new rune toens ==> ", result);

      if (!result.success) {
        await MultisigModal.findByIdAndDelete(payload.payload?.DBID);

        console.log("Remove new wallet cuz rune etching failed..");
        payload.message = "Vault creation is cancelled.";
        payload.payload = null;
        return res.status(200).send({
          success: result.success,
          message: result.message,
          payload: {
            vault: payload,
            rune: result,
          },
        });
      }

      return res.status(200).send({
        success: result.success,
        message: payload.message + " " + result.message,
        payload: {
          vault: payload,
          rune: result,
        },
      });
    } else {
      const payload = await createTaprootMultisig(
        pubKeyList,
        minSignCount,
        assets,
        imageUrl
      );

      console.log("payload after createNativeSegwit ==> ", payload);

      if (!payload.success)
        return res.status(200).send({
          success: payload.success,
          message: payload.message,
          payload: {
            vault: null,
            rune: null,
          },
        });

      console.log("Created new vault successfully!!");
      if (assets.runeName == "None")
        return res.status(200).send({
          success: payload.success,
          message: payload.message,
          payload: {
            vault: payload,
            rune: null,
          },
        });
      // Etching new rune tokens
      const { runeName, runeAmount, runeSymbol, initialPrice, creatorAddress } =
        assets;
      const result = await createRuneToken(
        runeName,
        runeAmount,
        runeSymbol,
        initialPrice,
        creatorAddress
      );
      console.log("Finished etching new rune toens ==> ", result);

      if (!result.success) {
        await MultisigModal.findByIdAndDelete(payload.payload?.DBID);

        console.log("Remove new wallet cuz rune etching failed..");
        payload.message = "Vault creation is cancelled.";
        payload.payload = null;
        return res.status(200).send({
          success: result.success,
          message: result.message,
          payload: {
            vault: payload,
            rune: result,
          },
        });
      }

      return res.status(200).send({
        success: result.success,
        message: payload.message + " " + result.message,
        payload: {
          vault: payload,
          rune: result,
        },
      });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "There is Something wrong..",
      payload: null,
    });
  }
});

multiSigWalletRoute.get("/fetchVaultList", async (req, res) => {
  try {
    console.log("fetchWalletList api is called!!");

    const nativeList = await MultisigModal.find();
    const taprootList = await TaprootMultisigModal.find();

    if (!nativeList.length && !taprootList.length)
      return res.status(200).send({
        success: false,
        message: "There is no wallet here.",
        payload: [],
      });
    return res.status(200).send({
      success: true,
      message: "Fetch wallet list successfully",
      payload: {
        native: nativeList,
        taproot: taprootList,
      },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "There is Something wrong..",
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/update-vault", async (req, res) => {
  try {
    console.log("update-vaultapi is called!!");

    const {
      vaultId,
      pubKeyList,
      minSignCount,
      assets,
      ordinalAddress,
      imageUrl,
      vaultType,
    } = req.body;

    console.log(
      "recreate api ==> ",
      vaultId,
      pubKeyList,
      minSignCount,
      assets,
      ordinalAddress,
      imageUrl,
      vaultType
    );

    let error = "";

    if (!imageUrl) error += "There is no imageUrl. ";
    if (!vaultId) error += "There is no vaultId. ";
    if (!pubKeyList.length) error += "There is no publicKey value.";
    if (!minSignCount) error += "There is no minSignCount value.";
    if (!minSignCount) error += "There is no minSignCount value.";
    if (!ordinalAddress) error += "There is no ordinalAddress value.";
    if (!vaultType) error += "There is no vaultType value.";

    if (error)
      return res.status(400).send({
        success: false,
        message: error,
        payload: null,
      });

    if (vaultType == VaultType.NativeSegwit) {
      const oldVault = await MultisigModal.findById(vaultId);
      if (!oldVault)
        return res.status(200).send({
          success: false,
          message: "There is no exist wallet with this id",
          payload: null,
        });

      const newWallet = await reCreateNativeSegwit(
        pubKeyList,
        minSignCount,
        assets,
        Bitcoin.networks.testnet,
        vaultId,
        imageUrl
      );
      console.log("new wallet ==> ", newWallet.message);
      if (!newWallet.payload)
        return res.status(200).send({
          success: newWallet.success,
          message: newWallet.message,
          payload: null,
        });

      const request = await transferAllAssets(
        oldVault,
        newWallet.payload,
        ordinalAddress
      );

      return res.status(200).send({
        success: true,
        message: "Request saved sucessfully",
        payload: request,
      });
    } else {
      const oldVault = await TaprootMultisigModal.findById(vaultId);
      if (!oldVault)
        return res.status(200).send({
          success: false,
          message: "There is no exist wallet with this id",
          payload: null,
        });

      const newWallet = await reCreateTaprootMultisig(
        pubKeyList,
        minSignCount,
        assets,
        imageUrl,
        vaultId
      );
      console.log("new wallet ==> ", newWallet.message);
      if (!newWallet.payload)
        return res.status(200).send({
          success: newWallet.success,
          message: newWallet.message,
          payload: null,
        });

      console.log("newWallet ==> ", newWallet);

      const request = await transferAllTaprootAssets(
        oldVault,
        newWallet.payload,
        ordinalAddress
      );

      return res.status(200).send({
        success: true,
        message: "Request saved sucessfully",
        payload: request,
      });
    }

    //   Transfer all assets from old to new
  } catch (error: any) {
    console.log("Updating vault error ==> ", error);
    return res.status(200).send({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/sendBtc", async (req, res) => {
  try {
    const { walletId, destination, amount, paymentAddress, pubKey, vaultType } =
      req.body;

    let error = "";

    if (!walletId) error += "There is no walletId value.";
    if (!destination) error += "There is no destination value.";
    if (!amount) error += "There is no amount value.";
    if (!vaultType) error += "There is no vaultType value.";

    if (vaultType == VaultType.NativeSegwit) {
      const result = await sendBtcController(
        walletId,
        destination,
        amount,
        paymentAddress,
        pubKey
      );

      return res.status(200).send(result);
    } else {
      const result = await sendBtcTaproot(
        walletId,
        amount,
        destination,
        paymentAddress
      );
      return res.status(200).send(result);
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "The request is made with failure.",
      payload: error,
    });
  }
});

multiSigWalletRoute.post("/sendRune", async (req, res) => {
  try {
    const {
      vaultId,
      destination,
      runeId,
      amount,
      ordinalAddress,
      ordinalPublicKey,
      vaultType,
    } = req.body;

    let error = "";

    if (!vaultId) error += "There is no walletId value.";
    if (!destination) error += "There is no destination value.";
    if (!runeId) error += "There is no runeId value.";
    if (!amount) error += "There is no amount value.";
    if (!ordinalAddress) error += "There is no ordinalAddress value.";
    if (!ordinalPublicKey) error += "There is no ordinalPublicKey value.";
    if (!vaultType) error += "There is no vaultType value.";

    if (vaultType == VaultType.NativeSegwit) {
      const result = await sendRuneController(
        vaultId,
        destination,
        runeId,
        amount,
        ordinalAddress,
        ordinalPublicKey
      );

      return res.status(200).send({
        success: true,
        message: "The request is made successfully",
        payload: result,
      });
    } else {
      console.log("<===== Taproot Transfer ====>");
      const result = await sendRuneTaproot(
        vaultId,
        runeId,
        amount,
        destination,
        ordinalAddress
      );
      return res.status(200).send(result);
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.get("/getAll", async (req, res) => {
  const payload = await loadAllMusigWallets();
  if (payload.success) return res.status(200).send(payload);
  else return res.status(500).send(payload);
});

multiSigWalletRoute.post("/getOne", async (req, res) => {
  const { id } = req.body;

  const payload = await loadOneMusigWallets(id);
  if (payload.success) return res.status(200).send(payload);
  else return res.status(500).send(payload);
});

multiSigWalletRoute.post("/createRequest", async (req, res) => {
  const { id, transferAmount, destinationAddress, ordinalAddress, pubKey } =
    req.body;

  const payload = await makeRequest(
    id,
    transferAmount,
    destinationAddress,
    ordinalAddress,
    pubKey
  );

  return res.status(200).send({
    success: true,
    message: "make the request successfully.",
    payload,
  });
});

multiSigWalletRoute.post("/createBtcRequest", async (req, res) => {
  const {
    id,
    transferAmount,
    destinationAddress,
    paymentAddress,
    paymentPubkey,
  } = req.body;

  const payload = await makeRequest(
    id,
    transferAmount,
    destinationAddress,
    paymentAddress,
    paymentPubkey
  );

  return res.status(200).send({
    success: true,
    message: "make the request successfully.",
    payload,
  });
});

multiSigWalletRoute.post("/getBtcAndRuneByAddress", async (req, res) => {
  try {
    const { address } = req.body;
    const payload = await getBtcAndRuneByAddressController(address);

    return res.status(200).send({
      success: true,
      message: "Get Btc and Rune successfully.",
      payload,
    });
  } catch (error) {
    return res.status(200).send({
      success: false,
      message: "Get Btc and Rune failed.",
      payload: null,
    });
  }
});

multiSigWalletRoute.get("/fetchTaprootVaultList", async (req, res) => {
  try {
    console.log("fetchTaprootVaultList api is called!!");
    const walletList = await TaprootMultisigModal.find();
    if (!walletList.length)
      return res.status(200).send({
        success: false,
        message: "There is no taproot wallet here.",
        payload: [],
      });
    return res.status(200).send({
      success: true,
      message: "Fetch taproot wallet list successfully",
      payload: walletList,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "There is Something wrong..",
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/sendBtcTaproot", async (req, res) => {
  try {
    const { id, amount, destinationAddress, paymentAddress } = req.body;
    const result = await sendBtcTaproot(
      id,
      amount,
      destinationAddress,
      paymentAddress
    );
    return res.status(200).send({
      success: true,
      message: "send PSBT is made successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("error ==> ", error);
  }
});

multiSigWalletRoute.post("/sendRuneTaproot", async (req, res) => {
  try {
    const { id, runeId, amount, destinationAddress, ordinalAddress } = req.body;
    const result = await sendRuneTaproot(
      id,
      runeId,
      amount,
      destinationAddress,
      ordinalAddress
    );
    return res.status(200).send({
      success: true,
      message: "send PSBT is made successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("error ==> ", error);
    return res.status(200).send({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/combine", async (req, res) => {
  console.log("exec in sendBtcRoute ==>  api is calling!!");
  try {
    const { id, psbt, signedPSBT, walletType } = req.body;
    const result = await broadcastPSBT(id, psbt, signedPSBT, walletType);

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({ success: false });
  }
});

multiSigWalletRoute.post("/send-ordinals-ns", async (req, res) => {
  console.log("exec in send-ordinals-ns ==>  api is calling!!");
  try {
    const { vaultId, destination, inscriptionId, paymentAddress } = req.body;
    let error = "";

    if (!vaultId) error += "There is no vaultId value.";
    if (!destination) error += "There is no destination value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendOrdinalsController(
      vaultId,
      destination,
      inscriptionId,
      paymentAddress
    );

    return res.status(200).json({
      success: true,
      message: "Send ordinals request saved successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(200).json({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/send-ordinals-taproot", async (req, res) => {
  console.log("send-ordinals-ns ==>  api is calling!!");
  try {
    const { vaultId, destination, inscriptionId, paymentAddress } =
      req.body;
    let error = "";

    if (!vaultId) error += "There is no walletId value.";
    if (!destination) error += "There is no destination value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendOrdinalTaproot(
      vaultId,
      inscriptionId,
      destination,
      paymentAddress
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({
      success: true,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/send-brc20-ns", async (req, res) => {
  console.log("send-brc20-ns ==>  api is calling!!");
  try {
    const {
      vaultId,
      inscriptionId,
      destination,
      ticker,
      amount,
      paymentAddress,
    } = req.body;

    console.log("req.body in send-brc20-ns ==> ", req.body);
    let error = "";

    if (!vaultId) error += "There is no vaultId value.";
    if (!destination) error += "There is no destination value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";
    if (!ticker) error += "There is no vaultId value.";
    if (!amount) error += "There is no destination value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendbrc20Controller(
      vaultId,
      inscriptionId,
      destination,
      ticker,
      amount,
      paymentAddress
    );

    return res.status(200).json({
      success: true,
      message: "Send brc20 request saved successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(200).json({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/send-brc20-taproot", async (req, res) => {
  console.log("send-brc20-taproot ==>  api is calling!!");
  try {
    const {
      vaultId,
      inscriptionId,
      destination,
      ticker,
      amount,
      paymentAddress,
    } = req.body;
    let error = "";

    if (!vaultId) error += "There is no vaultId value.";
    if (!destination) error += "There is no destination value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!amount) error += "There is no amount value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";
    if (!ticker) error += "There is no amount value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendBrc20Taproot(
      vaultId,
      inscriptionId,
      destination,
      ticker,
      amount,
      paymentAddress
    );

    return res.status(200).json({
      success: true,
      message: "Send brc20 request saved successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({
      success: true,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/checking-brc20-request", async (req, res) => {
  console.log("checking-brc20-request ==>  api is calling!!");
  try {
    const {
      multisigId,
      address,
      ticker,
      amount,
      paymentAddress,
      paymentPublicKey,
    } = req.body;
    let error = "";

    if (!multisigId) error += "There is no multisigId value.";
    if (!address) error += "There is no address value.";
    if (!ticker) error += "There is no destination value.";
    if (!amount) error += "There is no amount value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";
    if (!paymentPublicKey) error += "There is no paymentPublicKey value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await checkingBrc20Request(
      multisigId,
      address,
      ticker,
      amount,
      paymentAddress,
      paymentPublicKey
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({
      success: true,
      message: error,
      payload: null,
    });
  }
});

// Tap protocol

multiSigWalletRoute.post("/pre-tap-inscribe", async (req, res) => {
  try {
    const { paymentAddress, paymentPublicKey, itemList } = req.body;

    console.log("pre-tap-inscribe api is calling.");

    let error = "";
    if (!paymentAddress) error += "There is no paymentAddress value.";
    if (!paymentPublicKey) error += "There is no paymentPublicKey value.";
    if (!itemList) error += "There is no itemList value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await inscribeText(
      paymentAddress,
      paymentPublicKey,
      itemList
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/tap-inscribe", async (req, res, next) => {
  try {
    const {
      receiveAddress,
      privateKey,
      amount,
      hexedPsbt,
      signedHexedPsbt,
      itemList,
    } = req.body;

    let error = "";
    if (!receiveAddress) error += "There is no receiveAddress value.";
    if (!privateKey) error += "There is no privateKey value.";
    if (!amount) error += "There is no amount value.";
    if (!hexedPsbt) error += "There is no hexedPsbt value.";
    if (!signedHexedPsbt) error += "There is no signedHexedPsbt value.";
    if (!itemList) error += "There is no itemList value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }
    const result = await getInscribe(
      receiveAddress,
      privateKey,
      amount,
      hexedPsbt,
      signedHexedPsbt,
      itemList
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

multiSigWalletRoute.post("/get-tap-assets", async (req, res) => {
  const { address } = req.body;

  let error = "";
  if (!address) error += "There is no receiveAddress value.";
  if (error != "") {
    return res.status(200).json({
      success: false,
      message: error,
      payload: null,
    });
  }
  const balanceList = await fetchTapBalanceList(address);

  return res.status(200).send({
    success: true,
    message: "Fetch Tap balance Successfully",
    payload: balanceList,
  });
});

multiSigWalletRoute.post("/send-tap-ordinals-ns", async (req, res) => {
  console.log("exec in send-tap-ordinals-ns ==>  api is calling!!");
  try {
    const { vaultId, inscriptionId, paymentAddress, ordinalAddress } = req.body;
    let error = "";

    if (!vaultId) error += "There is no vaultId value.";
    if (!ordinalAddress) error += "There is no ordinalsAddress value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendTapOrdinalsController(
      vaultId,
      inscriptionId,
      paymentAddress,
      ordinalAddress
    );

    return res.status(200).json({
      success: true,
      message: "Send Tap inscription request saved successfully.",
      payload: result,
    });
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(200).json({
      success: false,
      message: error,
      payload: null,
    });
  }
});

multiSigWalletRoute.post("/send-tap-ordinals-taproot", async (req, res) => {
  console.log("send-tap-ordinals-taproot ==>  api is calling!!");
  try {
    const { vaultId, inscriptionId, paymentAddress, ordinalAddress } =
      req.body;
    let error = "";

    if (!vaultId) error += "There is no walletId value.";
    if (!ordinalAddress) error += "There is no ordinalAddress value.";
    if (!inscriptionId) error += "There is no inscriptionId value.";
    if (!paymentAddress) error += "There is no paymentAddress value.";

    if (error != "") {
      return res.status(200).json({
        success: false,
        message: error,
        payload: null,
      });
    }

    const result = await sendTapOrdinalTaproot(
      vaultId,
      inscriptionId,
      paymentAddress
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log("exec PSBT Error : ", error);
    return res.status(500).json({
      success: true,
      message: error,
      payload: null,
    });
  }
});

// End Tap Protocol

export default multiSigWalletRoute;
