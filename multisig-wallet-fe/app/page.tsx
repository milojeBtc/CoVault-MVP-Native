"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { Psbt } from "bitcoinjs-lib";

import Notiflix from "notiflix";

import WalletContext from "./contexts/WalletContext";
import {
  BatchTypes,
  IAirdropWalletList,
  IRequest,
  IWalletList,
  SIGN_MESSAGE,
  TEST_MODE,
  WalletTypes,
} from "./utils/utils";
import { IErr, IRuneAssets, IRuneDetail, ISelectOption } from "./utils/_type";

import {
  Tabs,
  Tab,
  Checkbox,
  Card,
  CardBody,
  Link,
  useDisclosure,
} from "@nextui-org/react";

import {
  cancelRequestPsbtController,
  createNewAirdropVault,
  createNewSyndicateVault,
  createNewVault,
  fetchRequestListController,
  fetchRequestPsbtController,
  fetchRuneListByAddressController,
  fetchVaultController,
  updateRequestPsbtController,
  updateVault,
  walletConnect,
} from "./controller";
import { MdOutlineContentCopy } from "react-icons/md";
import { SlWallet } from "react-icons/sl";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  signMessage,
} from "sats-connect";
import { useClipboard } from "use-clipboard-copy";

// React Icons
import { FaVault } from "react-icons/fa6";
import { SiVaultwarden } from "react-icons/si";
import { ImShield } from "react-icons/im";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { AiOutlineUpload } from "react-icons/ai";
import { RadioGroup, Radio } from "@nextui-org/react";

export default function Page() {
  const coSignerRef = useRef(null);

  const runeNameRef = useRef(null);
  const runeAmountRef = useRef(null);
  const runePriceRef = useRef(null);
  const runeSymbolRef = useRef(null);

  const [err, setErr] = useState<IErr>();
  const [transactionID, setTransactionID] = useState("");
  const [newVault, setNewVault] = useState<string>("");
  const [selectedVault, setSelectedVault] = useState<IWalletList>();
  const [selectedRequest, setSelectedRequest] = useState<IRequest>();
  const [walletList, setWalletList] = useState<IWalletList[]>();
  const [requestList, setRequestList] = useState<IRequest[]>();
  const [assetsFlag, setAssetsFlag] = useState(false);

  const [selected, setSelected] = useState("multi");

  // Batch Modal
  const [modalFlag, setModalFlag] = useState(BatchTypes.Ready);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAirdropWallet, setSelectedAirdropWallet] =
    useState<IAirdropWalletList>();
  const [batchOption, setBatchOption] = useState<ISelectOption[]>();
  const [runeList, setRuneList] = useState<IRuneDetail[]>();
  // End

  // Connect Wallet
  const [modalOpen, setModalOpen] = useState(false);
  const onConnectWalletOpen = async () => {
    setModalOpen(true);
  };
  // End

  // Loading
  const [loading, setLoading] = useState(false);
  // End

  // CreateNewVault
  const [coSignerCount, setCoSignerCount] = useState(0);
  const [coSigner, setCoSigner] = useState(0);
  const changeCosignerHandler = async (index: number) => {
    const temp = Math.min(Math.max(coSigner + index, 0), coSignerCount);
    console.log("temp ==> ", temp);
    setCoSigner(temp);
  };

  const [typeSelected, setTypeSelected] = useState("NativeSegwit");
  // End

  // Image Upload
  const [avatar, setAvatar] = useState({
    preview: "",
  });

  // Wallet Connection
  const storeLocalStorage = (
    ordinalsAddress: string,
    ordinalsPublickey: string,
    paymentAddress: string,
    paymentPublicKey: string
  ) => {
    localStorage.setItem("ordinalsAddress", ordinalsAddress);
    localStorage.setItem("ordinalsPublickey", ordinalsPublickey);
    localStorage.setItem("paymentAddress", paymentAddress);
    localStorage.setItem("paymentPublicKey", paymentPublicKey);
  };

  const removeLocalStorage = () => {
    localStorage.removeItem("ordinalsAddress");
    localStorage.removeItem("ordinalsPublickey");
    localStorage.removeItem("paymentAddress");
    localStorage.removeItem("paymentPublicKey");
  };

  const recoverWalletConnection = () => {
    const ordinalsAddress = localStorage.getItem("ordinalsAddress");
    const ordinalsPublickey = localStorage.getItem("ordinalsPublickey");
    const paymentAddress = localStorage.getItem("paymentAddress");
    const paymentPublicKey = localStorage.getItem("paymentPublicKey");

    if (
      ordinalsAddress &&
      ordinalsPublickey &&
      paymentAddress &&
      paymentPublicKey
    ) {
      setOrdinalAddress(ordinalsAddress);
      setPaymentAddress(paymentAddress);
      setOrdinalPublicKey(ordinalsPublickey);
      setPaymentPublicKey(paymentPublicKey);
    }
  };
  // End Connection

  const fileInput = useRef<HTMLInputElement>(null);
  const uploadFile = async (evt: any) => {
    evt.preventDefault();

    console.log("uploaded file ==> ", fileInput?.current?.files);
    if (fileInput?.current?.files?.[0]!) {
      setAvatar({
        preview: URL.createObjectURL(fileInput?.current?.files?.[0]!),
      });
    }
  };

  // End

  const {
    walletType,
    ordinalAddress,
    ordinalPublicKey,
    paymentAddress,
    paymentPublicKey,
    pageIndex,
    setPageIndex,
    setWalletType,
    setOrdinalAddress,
    setPaymentAddress,
    setPaymentPublicKey,
    setOrdinalPublicKey,
  } = useContext(WalletContext);

  const isConnected = Boolean(ordinalAddress);

  const batchModalOpen = async (wallet: IAirdropWalletList) => {
    setSelectedAirdropWallet(wallet);
    console.log("wallet.edition ==> ", wallet);
    const tempOption: ISelectOption[] = [];
    const runeAssets = await fetchRuneListByAddressController(wallet.address);
    if (runeAssets.length) {
      setRuneList(runeAssets);
      console.log("runeAssets ==> ", runeAssets);
      runeAssets.map((rune: IRuneDetail, index: number) => {
        tempOption.push({
          value: index,
          label: rune.spacedRune,
        });
      });
      console.log("tempOption ==> ", tempOption);
      setModalFlag(BatchTypes.Ready);
      setBatchOption(tempOption);
      onOpen();
    } else {
      Notiflix.Notify.failure("No assets in this vault.");
    }
  };

  const onChangeHandler = () => {
    setErr({
      cosigner: "",
      thresHold: "",
    });
    if (coSignerRef.current) {
      const str: string = (coSignerRef.current as any).value;
      const length = str.split("\n").length;
      console.log("length ==> ", length);
      setCoSignerCount(length);
    }
  };

  const updateWallet = async () => {
    try {
      if (!selectedVault) return;
      let cosignerList = [];
      let thresHoldValue = "";

      if (!fileInput?.current?.files?.[0]!) {
        Notiflix.Notify.failure("The banner image is required.");
        return;
      }

      const formData = new FormData();
      formData.append("file", fileInput?.current?.files?.[0]!);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log("result ==> ", result);
      if (!result.success) {
        Notiflix.Notify.failure("Get error while uploading image.");
        return;
      }
      // return
      const imageUrl = result.payload;

      if (coSignerRef.current)
        cosignerList = (coSignerRef.current["value"] as any).split("\n");
      thresHoldValue = coSigner.toString();

      if (walletType == WalletTypes.UNISAT) {
        const result = await updateVault(
          selectedVault,
          cosignerList,
          parseInt(thresHoldValue),
          ordinalAddress,
          imageUrl
        );
        console.log("New Vault on updateWallet==> ", result);
        if (result.success) {
          Notiflix.Notify.success(result.message);
          setNewVault(result.payload);
        } else {
          Notiflix.Notify.failure(result.message);
        }

        console.log(result.payload);
      }
    } catch (error) {
      console.log("submit ==> ", error);
    }
  };

  const onCreateNewWallet = async () => {
    try {
      let cosignerList = [];
      // let thresHoldValue = "";
      const assets: IRuneAssets = {
        runeName: "None",
        runeAmount: "None",
        initialPrice: "None",
        runeSymbol: "None",
        creatorAddress: ordinalAddress,
      };

      if (!fileInput?.current?.files?.[0]!) {
        Notiflix.Notify.failure("The banner image is required.");
        return;
      }

      if (runeNameRef.current) assets.runeName = runeNameRef.current["value"];
      if (runeAmountRef.current)
        assets.runeAmount = runeAmountRef.current["value"];
      if (runePriceRef.current)
        assets.initialPrice = runePriceRef.current["value"];
      if (runeSymbolRef.current)
        assets.runeSymbol = runeSymbolRef.current["value"];

      if (coSignerRef.current)
        cosignerList = (coSignerRef.current["value"] as any).split("\n");

      const formData = new FormData();
      formData.append("file", fileInput?.current?.files?.[0]!);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log("result ==> ", result);
      if (!result.success) {
        Notiflix.Notify.failure("Get error while uploading image.");
        return;
      }
      // return
      const imageUrl = result.payload;
      // if (thresHold.current) thresHoldValue = thresHold.current["value"];
      if (!coSignerCount) return;
      const thresHoldValue = coSignerCount.toString();

      if (walletType == WalletTypes.UNISAT) {
        const result = await createNewVault(
          cosignerList,
          thresHoldValue,
          assets,
          imageUrl,
          typeSelected
        );
        console.log("New Vault on submit ==> ", result);

        if (result.success) {
          Notiflix.Notify.success(result.message);
          console.log("new address ==> ", result.payload.vault.payload.address);
          setNewVault(result.payload.vault.payload.address);
        } else Notiflix.Notify.failure(result.message);

        console.log("vault ==> ", result.vault.payload);
        console.log("rune ==> ", result.rune.payload);

        // }
      }
    } catch (error) {
      console.log("submit ==> ", error);
    }
  };

  const onCreateNewAirdropWallet = async () => {
    try {
      let cosignerList = [paymentPublicKey];
      let thresHoldValue = "1";
      const assets: IRuneAssets = {
        runeName: "None",
        runeAmount: "None",
        initialPrice: "None",
        runeSymbol: "None",
        creatorAddress: ordinalAddress,
      };

      if (!fileInput?.current?.files?.[0]!) {
        Notiflix.Notify.failure("The banner image is required.");
        return;
      }

      if (runeNameRef.current) assets.runeName = runeNameRef.current["value"];
      if (runeAmountRef.current)
        assets.runeAmount = runeAmountRef.current["value"];
      if (runePriceRef.current)
        assets.initialPrice = runePriceRef.current["value"];
      if (runeSymbolRef.current)
        assets.runeSymbol = runeSymbolRef.current["value"];

      const formData = new FormData();
      formData.append("file", fileInput?.current?.files?.[0]!);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log("result ==> ", result);
      if (!result.success) {
        Notiflix.Notify.failure("Get error while uploading image.");
        return;
      }
      // return
      const imageUrl = result.payload;
      console.log("imageUrl ==> ", imageUrl);

      if (walletType == WalletTypes.UNISAT) {
        const result = await createNewAirdropVault(
          cosignerList,
          thresHoldValue,
          {
            paymentAddress,
            paymentPublicKey,
            ordinalAddress,
            ordinalPublicKey,
          },
          assets,
          imageUrl
        );
        console.log("New Vault on submit ==> ", result);

        if (result.success) {
          Notiflix.Notify.success(result.message);
          console.log("new address ==> ", result.payload.vault.payload.address);
          setNewVault(result.payload.vault.payload.address);
        } else Notiflix.Notify.failure(result.message);

        console.log("vault ==> ", result.payload.vault.payload);
        console.log("rune ==> ", result.payload.rune.payload);
      }
    } catch (error) {
      console.log("submit ==> ", error);
    }
  };

  const onCreateNewSyndicateVault = async () => {
    try {
      let cosignerList = [];
      // let thresHoldValue = "";
      const assets: IRuneAssets = {
        runeName: "None",
        runeAmount: "None",
        initialPrice: "None",
        runeSymbol: "None",
        creatorAddress: ordinalAddress,
      };

      if (!fileInput?.current?.files?.[0]!) {
        Notiflix.Notify.failure("The banner image is required.");
        return;
      }

      if (runeNameRef.current) assets.runeName = runeNameRef.current["value"];
      if (runeAmountRef.current)
        assets.runeAmount = runeAmountRef.current["value"];
      if (runePriceRef.current)
        assets.initialPrice = runePriceRef.current["value"];
      if (runeSymbolRef.current)
        assets.runeSymbol = runeSymbolRef.current["value"];

      if (coSignerRef.current)
        cosignerList = (coSignerRef.current["value"] as any).split("\n");

      const formData = new FormData();
      formData.append("file", fileInput?.current?.files?.[0]!);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log("result ==> ", result);
      if (!result.success) {
        Notiflix.Notify.failure("Get error while uploading image.");
        return;
      }
      // return
      const imageUrl = result.payload;
      // if (thresHold.current) thresHoldValue = thresHold.current["value"];
      if (!coSignerCount) return;
      const thresHoldValue = coSignerCount.toString();

      if (walletType == WalletTypes.UNISAT) {
        const result = await createNewSyndicateVault(
          cosignerList,
          thresHoldValue,
          {
            paymentAddress,
            paymentPublicKey,
            ordinalAddress,
            ordinalPublicKey,
          },
          assets,
          imageUrl
        );
        console.log("New Vault on submit ==> ", result);

        if (result.success) {
          Notiflix.Notify.success(result.message);
          console.log("new address ==> ", result.payload.vault.payload.address);
          setNewVault(result.payload.vault.payload.address);
        } else Notiflix.Notify.failure(result.message);

        console.log("vault ==> ", result.payload.vault.payload);
        console.log("rune ==> ", result.payload.rune.payload);

        // }
      }
      // else if (walletType == WalletTypes.XVERSE) await xverseSendBTC(destinationAddress, parseInt(amountToTransfer));
      // else if (walletType == WalletTypes.MAGICEDEN) await MEsendBtc(destinationAddress, parseInt(amountToTransfer));
    } catch (error) {
      console.log("submit ==> ", error);
    }
  };

  const fetchWallets = async () => {
    console.log("fetch wallets ==>");
    // setLoading(true);
    Notiflix.Loading.hourglass("Fetching wallets info...");
    const result = await fetchVaultController();
    console.log("result ==> ", result);
    if (result.success) {
      Notiflix.Notify.success(result.message);
      setWalletList(result.payload);
    } else {
      Notiflix.Notify.failure(result.message);
    }
    setLoading(false);
    Notiflix.Loading.remove();
  };

  const updateHandler = async (wallet: IWalletList) => {
    setPageIndex(2);
    setSelectedVault(wallet);
  };

  const updateRequestHandler = async (request: IRequest) => {
    const allowed = request.cosigner.findIndex(
      (key) => key == paymentPublicKey
    );
    console.log("allowed ==> ", allowed);
    if (allowed < 0)
      return Notiflix.Notify.failure("You are not co-signer of this wallet!");

    const repeated = request.signedCosigner.findIndex(
      (key) => key == paymentPublicKey
    );
    console.log("repeated ==> ", repeated);
    if (repeated >= 0)
      return Notiflix.Notify.failure("You already signed in this request");

    setSelectedRequest(request);
    const result = await fetchRequestPsbtController(
      request._id,
      paymentPublicKey
    );
    console.log("fetchRequestPsbtController ==> ", result);
    const psbt = result.payload;
    console.log("request psbt ==>", psbt);
    if (psbt) {
      try {
        const tempPsbt = Psbt.fromHex(psbt);
        const inputCount = tempPsbt.inputCount;
        const inputArray = Array.from({ length: inputCount }, (_, i) => i);
        console.log("inputArray ==> ", inputArray);
        const toSignInputs: {
          index: number;
          publicKey: string;
          disableTweakSigner: boolean;
        }[] = [];
        inputArray.map((value: number) =>
          toSignInputs.push({
            index: value,
            publicKey: paymentPublicKey,
            disableTweakSigner: true,
          })
        );
        console.log("toSignInputs ==> ", toSignInputs);
        const signedPsbt = await (window as any).unisat.signPsbt(psbt, {
          autoFinalized: false,
          toSignInputs,
        });
        console.log("signedPsbt ==> ", signedPsbt);
        const result = await updateRequestPsbtController(
          signedPsbt,
          request._id,
          paymentPublicKey
        );
        console.log("after update request result ==> ", result);
        if (result) {
          Notiflix.Notify.success(result.message);
          if (result.message == "Transaction broadcasting successfully.") {
            Notiflix.Notify.success(result.payload);
          }
          await fetchRequestList();
        }
      } catch (error) {
        console.log("reject sign on unisat ==> ", error);
        const result = await cancelRequestPsbtController(
          request._id,
          paymentPublicKey
        );
        console.log("after cancel request result ==> ", result);
      }
    } else {
      Notiflix.Notify.failure(result.message);
    }
  };

  const fetchRequestList = async () => {
    console.log("fetchRequestList ==> ");
    setLoading(true);
    const requestResponse = await fetchRequestListController();
    if (!requestResponse) {
      setLoading(false);
      return;
    }
    setRequestList(requestResponse);
    setLoading(false);
  };

  const assetsChangeHandler = async () => {
    setAssetsFlag((flag) => !flag);
  };

  // Connect wallet
  const [hash, setHash] = useState("");
  const unisatConnectWallet = async () => {
    try {
      const currentWindow: any = window;
      if (typeof currentWindow?.unisat !== "undefined") {
        const unisat: any = currentWindow?.unisat;
        try {
          let accounts: string[] = await unisat.requestAccounts();
          let pubkey = await unisat.getPublicKey();

          let res = await unisat.signMessage(SIGN_MESSAGE);
          setHash(res);

          const tempWalletType = WalletTypes.UNISAT;
          const tempOrdinalAddress = accounts[0];
          const tempPaymentAddress = accounts[0];
          const tempOrdinalPublicKey = pubkey;
          const tempPaymentPublicKey = pubkey;

          const savedHash = await walletConnect(
            tempPaymentAddress,
            tempPaymentPublicKey,
            tempOrdinalAddress,
            tempOrdinalPublicKey,
            tempWalletType,
            res
          );

          if (savedHash.success) {
            Notiflix.Notify.success("Connect succes!");
            setWalletType(WalletTypes.UNISAT);
            setOrdinalAddress(accounts[0] || "");
            setPaymentAddress(accounts[0] || "");
            setOrdinalPublicKey(pubkey);
            setPaymentPublicKey(pubkey);

            storeLocalStorage(accounts[0], pubkey, accounts[0], pubkey);

            onClose();
          } else {
            Notiflix.Notify.failure("No match hash!");
          }
        } catch (e: any) {
          console.log("unisat wallet error ==> ", e);
          if (e.message) {
            Notiflix.Notify.failure(e.message);
          } else {
            Notiflix.Notify.failure("Connect failed!");
          }
        }
      } else {
        Notiflix.Notify.failure("Plz install wallet extention first!");
      }
    } catch (error) {
      console.log("unisatConnectWallet error ==> ", error);
    }
  };

  const xverseConnectWallet = async () => {
    try {
      if (!(window as any).XverseProviders) {
        Notiflix.Notify.failure("Plz install wallet extention first!");
      }
      await getAddress({
        payload: {
          purposes: [
            AddressPurpose.Ordinals,
            AddressPurpose.Payment,
            AddressPurpose.Stacks,
          ],
          message: "Welcome Co-vault",
          network: {
            type: BitcoinNetworkType.Testnet,
          },
        },
        onFinish: async (response) => {
          const paymentAddressItem = response.addresses.find(
            (address) => address.purpose === AddressPurpose.Payment
          );
          const ordinalsAddressItem = response.addresses.find(
            (address) => address.purpose === AddressPurpose.Ordinals
          );

          let tempWalletType = WalletTypes.XVERSE;
          let tempOrdinalAddress = ordinalsAddressItem?.address as string;
          let tempPaymentAddress = paymentAddressItem?.address as string;
          let tempOrdinalPublicKey = ordinalsAddressItem?.publicKey as string;
          let tempPaymentPublicKey = paymentAddressItem?.publicKey as string;

          let res = "";
          await signMessage({
            payload: {
              network: {
                type: BitcoinNetworkType.Testnet,
              },
              address: paymentAddressItem?.address as string,
              message: "Sign in Co-vault",
            },
            onFinish: (response: any) => {
              // signature
              res = response;
              return response;
            },
            onCancel: () => alert("Canceled"),
          });

          const savedHash = await walletConnect(
            tempPaymentAddress,
            tempPaymentPublicKey,
            tempOrdinalAddress,
            tempOrdinalPublicKey,
            tempWalletType,
            res
          );

          if (savedHash.success) {
            Notiflix.Notify.success("Connect succes!");
            setWalletType(WalletTypes.XVERSE);
            setPaymentAddress(paymentAddressItem?.address as string);
            setPaymentPublicKey(paymentAddressItem?.publicKey as string);
            setOrdinalAddress(ordinalsAddressItem?.address as string);
            setOrdinalPublicKey(ordinalsAddressItem?.publicKey as string);

            storeLocalStorage(
              ordinalsAddressItem?.address as string,
              ordinalsAddressItem?.publicKey as string,
              paymentAddressItem?.address as string,
              paymentAddressItem?.publicKey as string
            );

            onClose();
          } else {
            Notiflix.Notify.failure("No match hash!");
          }
        },
        onCancel: () => alert("Request canceled"),
      });
    } catch (error) {
      console.log("xverseConnectWallet error ==> ", error);
    }
  };
  // End Wallet Connection

  // CopyHandler
  const clipboard = useClipboard();
  const onCopyClipboard = (str: string | undefined) => {
    if (!str) return;
    Notiflix.Notify.success("Copied to clipboard.");
    clipboard.copy(str);
  };
  // End

  useEffect(() => {
    if (paymentAddress) fetchWallets();
  }, [paymentAddress]);

  useEffect(() => {
    if (paymentAddress)
      switch (pageIndex) {
        case 0:
          fetchWallets();
          break;
        default:
          break;
      }
    setNewVault("");
  }, [pageIndex]);

  useEffect(() => {
    setNewVault("");
  }, [selected]);

  return (
    <>
      <div className="flex w-full justify-center items-center">
        <img src="bg1.png" className="brightness-150"></img>
      </div>
      <div className="absolute z-10 w-full top-32 left-0 p-2 pb-20 bg-[#131416] min-h-screen">
        {isConnected ? (
          <></>
        ) : (
          <div className="mx-auto mt-28 w-[450px] h-[450px] bg-gradient-to-br from-[#6D757F] via-[#28292c] to-[#1C1D1F] p-[2px] rounded-xl">
            {!modalOpen ? (
              <div className="w-full h-full flex flex-col gap-2 items-center bg-[#1C1D1F] rounded-xl">
                <img
                  src="wallet_connect_logo.png"
                  className="mx-auto mt-10 "
                ></img>
                <div className="flex flex-row items-center text-white gap-2 text-[24px]">
                  <p>WELCOME TO</p>
                  <img src="logo2.png" className="brightness-150"></img>
                  <p>COVAULT</p>
                </div>
                <p className="text-gray-600 text-[18px]">
                  Connect to your Bitcoin wallet
                </p>
                <div
                  className="flex flex-row border-1 border-[#FEE505] py-3 px-5 text-[#FEE505] rounded-xl items-center gap-4 hover:brightness-150 duration-300 cursor-pointer mt-20"
                  onClick={onConnectWalletOpen}
                >
                  <SlWallet />
                  Connect Wallet
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col gap-3 items-center bg-[#1C1D1F] rounded-xl p-6">
                <div className="flex flex-col text-white text-[30px] mt-4 mb-10">
                  <p className="text-center">Connect to your</p>
                  <p className="text-center">Bitcoin wallet</p>
                </div>
                <div
                  className="flex flex-row justify-between rounded-2xl w-full p-2 bg-[#131416] cursor-pointer hover:brightness-125 duration-300"
                  onClick={unisatConnectWallet}
                >
                  <div className="flex flex-row gap-2 p-2 items-center">
                    <img src="wallet/unisat.png"></img>
                    <p className="text-white text-[20px]">Unisat</p>
                  </div>
                  {(window as any).unisat ? (
                    <div className="py-1 px-3 bg-[#28292C] text-gray-500 rounded-2xl text-center my-auto ml-auto mr-36">
                      • Installed
                    </div>
                  ) : (
                    <a
                      className="py-3 px-5 bg-[#28292C] text-white rounded-2xl text-center my-auto"
                      href="https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo"
                      target="_blank"
                    >
                      Install
                    </a>
                  )}
                </div>

                <div
                  className="flex flex-row justify-between rounded-2xl w-full p-2 bg-[#131416] cursor-pointer hover:brightness-125 duration-300"
                  onClick={xverseConnectWallet}
                >
                  <div className="flex flex-row gap-2 p-2 items-center">
                    <img src="wallet/xverse.png"></img>
                    <p className="text-white text-[20px]">Xverse</p>
                  </div>
                  {(window as any).XverseProviders ? (
                    <div className="py-1 px-3 bg-[#28292C] text-gray-500 rounded-2xl text-center my-auto ml-auto mr-36">
                      • Installed
                    </div>
                  ) : (
                    <a
                      className="py-3 px-5 bg-[#28292C] text-white rounded-2xl text-center my-auto"
                      href="https://chromewebstore.google.com/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg"
                      target="_blank"
                    >
                      Install
                    </a>
                  )}
                </div>

                <div className="flex flex-row justify-between rounded-2xl w-full p-2 bg-[#131416]">
                  <div className="flex flex-row gap-2 p-2 items-center">
                    <img src="wallet/leather.png"></img>
                    <p className="text-white text-[20px]">Leather</p>
                  </div>
                  {(window as any).LeatherProvider ? (
                    <div className="py-1 px-3 bg-[#28292C] text-gray-500 rounded-2xl text-center my-auto ml-auto mr-36">
                      • Installed
                    </div>
                  ) : (
                    <a
                      className="py-3 px-5 bg-[#28292C] text-white rounded-2xl text-center my-auto"
                      href="https://chromewebstore.google.com/detail/leather/ldinpeekobnhjjdofggfgjlcehhmanlj"
                      target="_blank"
                    >
                      Install
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {isConnected && (
          <div className="mt-10">
            {/* Dashboard - Wallet List */}
            {pageIndex == 0 ? (
              <div className="flex flex-wrap mx-4 items-start justify-between pt-4 gap-4">
                {walletList?.length ? (
                  walletList.map((wallet: IWalletList, index: number) => (
                    <div
                      className="flex flex-col gap-3 w-[450px] px-6 rounded-3xl border-2 border-[#2C2C2C] bg-[#1C1D1F] p-4 text-white"
                      key={index + "wallet"}
                    >
                      <div className="flex flex-row gap-4 pb-5 border-b-2 border-b-[#28292C] items-center">
                        <img
                          className="rounded-full p-2 border-2 border-[#28292C] w-[50px] h-[50px]"
                          src={
                            wallet.imageUrl
                              ? `/uploads/${wallet.imageUrl}`
                              : "/multi-vault.png"
                          }
                        ></img>
                        <div className="flex flex-col truncate">
                          <p>Vault address</p>
                          <div className="flex flex-row gap-2 items-center">
                            <p className="text-[#FEE505] font-bold truncate underline underline-offset-4">
                              {wallet.address}
                            </p>
                            <MdOutlineContentCopy
                              size={36}
                              className="text-[#5C636C] hover:text-white duration-300 cursor-pointer"
                              onClick={() => onCopyClipboard(wallet.address)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row justify-between mt-4">
                        <p className="mr-10">Cosigners: </p>
                        {wallet.cosigner.map((cosigner, index) => (
                          <div
                            className="truncate bg-[#28292C] ml-2 rounded-xl px-2"
                            key={"cosinger" + index}
                          >
                            {cosigner}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-row justify-between">
                        <p>Threshold:</p>
                        <p>{wallet.threshold}</p>
                      </div>
                      <div className="flex flex-row justify-between pb-6 border-b-2 border-[#2C2C2C] mb-4">
                        <p>CreatedAt:</p>
                        <p>{wallet.createdAt.split("T")[0]}</p>
                      </div>
                      <div
                        className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                        onClick={() => updateHandler(wallet)}
                      >
                        <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                          <p className="text-white text-center align-middle">
                            Update
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>No Vault here</>
                )}
              </div>
            ) : (
              <></>
            )}

            {/* Create New vault */}
            {pageIndex == 1 ? (
              <div className="flex flex-col w-full">
                <div className="max-w-full min-[640px]:w-[644px] max-[640px]:w-[594px] py-[2px] bg-gradient-to-br from-[#6D757F] via-[#28292C] to-[#28292C] mx-auto rounded-xl">
                  <Card className="max-w-full min-[640px]:w-[640px] max-[640px]:w-[590px] mx-auto bg-[#1C1D1F] p-3">
                    <CardBody className="overflow-hidden">
                      <Tabs
                        fullWidth
                        size="md"
                        aria-label="Tabs form"
                        selectedKey={selected}
                        // @ts-ignore
                        onSelectionChange={setSelected}
                        variant="bordered"
                        classNames={{
                          tabList:
                            "gap-6 w-full relative rounded-none p-0 border-b border-divider bg-[#131416] p-1 rounded-2xl",
                          cursor: "w-full bg-[#262515] border border-[#C3B109]",
                          tabContent:
                            "group-data-[selected=true]:text-[#FEE505] text-white",
                        }}
                      >
                        <Tab
                          key="multi"
                          title={
                            <div className="flex flex-row items-center gap-4">
                              <FaVault />
                              <p>New Vault</p>
                            </div>
                          }
                        >
                          <div className="flex flex-col items-center justify-between pt-4">
                            <div className="flex flex-col gap-2 bg-[#1C1D1F] mx-auto  min-[640px]:w-[600px] max-[640px]:w-[550px] rounded-xl p-3 ">
                              <div className="flex flex-row justify-center px-4 py-2">
                                <h3 className="text-[24px] font-manrope text-white leading-8">
                                  Create New vault
                                </h3>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-3 ">
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                      Vault Type
                                    </label>
                                    <RadioGroup
                                      value={typeSelected}
                                      onValueChange={setTypeSelected}
                                      className="ml-4"
                                    >
                                      <Radio value="NativeSegwit">
                                        <p className="text-white">
                                          Native Segwit
                                        </p>
                                      </Radio>
                                      <Radio value="Taproot">
                                        <p className="text-white">Taproot</p>
                                      </Radio>
                                    </RadioGroup>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                      Co-signer
                                    </label>
                                    <textarea
                                      className="bg-[#131416] border-2 border-[#28292C] p-3 rounded-xl text-white"
                                      placeholder="Add co-signer wallet address"
                                      ref={coSignerRef}
                                      onChange={() => onChangeHandler()}
                                    />

                                    {err ? (
                                      <p className="text-red-600">
                                        {err.cosigner}
                                      </p>
                                    ) : (
                                      <></>
                                    )}
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                                      input vault address then press space to
                                      add
                                    </label>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                      Threshold vaule
                                    </label>
                                    <div className="flex flex-row items-center gap-4">
                                      <div className="flex flex-row items-center gap-2 bg-[#131416] border-2 border-[#28292C] rounded-xl focus:outline-none">
                                        <div
                                          className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                                          onClick={() =>
                                            changeCosignerHandler(-1)
                                          }
                                        >
                                          <FaMinus color="gray" size={20} />
                                        </div>
                                        <p className="text-white text-center w-[200px]">
                                          {coSigner}
                                        </p>

                                        <div
                                          className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                                          onClick={() =>
                                            changeCosignerHandler(1)
                                          }
                                        >
                                          <FaPlus color="gray" size={20} />
                                        </div>
                                      </div>
                                      <p className="text-white min-w-[600px]">
                                        Out of {coSignerCount} co-signer
                                      </p>
                                    </div>

                                    {err ? (
                                      <p className="text-red-600">
                                        {err.thresHold}
                                      </p>
                                    ) : (
                                      <></>
                                    )}
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                                      Number of co-signer to confirm any
                                      transaction
                                    </label>

                                    <Checkbox
                                      radius="lg"
                                      onChange={() => assetsChangeHandler()}
                                      className="mt-4 mb-2"
                                      isSelected={assetsFlag}
                                    >
                                      <p className="text-white">
                                        Use Rune as DAO token?
                                      </p>
                                    </Checkbox>
                                    {assetsFlag ? (
                                      <div className="flex flex-row justify-between gap-4 pt-4 border-t-2 border-[#28292C]">
                                        <div className="flex flex-col justify-center gap-1">
                                          <p className="text-white text-center">
                                            Upload Image
                                          </p>
                                          <input
                                            type="file"
                                            style={{ display: "none" }}
                                            id="upload-button"
                                            ref={fileInput}
                                            accept="image/*"
                                            onChange={uploadFile}
                                          />
                                          <label htmlFor="upload-button">
                                            {avatar.preview ? (
                                              <img
                                                src={avatar.preview}
                                                alt="dummy"
                                                width="160px"
                                                height="160px"
                                                className=""
                                              />
                                            ) : (
                                              <div className="flex flex-col gap-1 rounded-xl bg-[#28292C] w-40 h-40 justify-center items-center hover:brightness-150 duration-300 cursor-pointer">
                                                <AiOutlineUpload
                                                  color="white"
                                                  size={26}
                                                />
                                                <p className="text-white">
                                                  Upload
                                                </p>
                                              </div>
                                            )}
                                          </label>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              RuneName
                                            </label>
                                            <input
                                              name="RuneName"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="UNCOMMONGOODS"
                                              ref={runeNameRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Amount
                                            </label>
                                            <input
                                              name="RuneAmount"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runeAmountRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Price
                                            </label>
                                            <input
                                              name="initialPrice"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runePriceRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Symbol
                                            </label>
                                            <input
                                              name="RuneSymbol"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runeSymbolRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                </div>

                                <button
                                  className="bg-[#FEE505] rounded-xl px-6 py-3 w-full hover:brightness-150 duration-300 mt-10"
                                  type="submit"
                                  onClick={() => onCreateNewWallet()}
                                >
                                  <div className="flex flex-row gap-4 items-center justify-center">
                                    <FaVault />
                                    <p className="text-black font-manrope text-[14px] font-semibold leading-6 ">
                                      Create New Vault
                                    </p>
                                  </div>
                                </button>
                                {transactionID ? (
                                  <a
                                    href={
                                      TEST_MODE
                                        ? `https://mempool.space/testnet/tx/${transactionID}`
                                        : `https://mempool.space/tx/${transactionID}`
                                    }
                                  />
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>

                            {newVault ? (
                              <div className="text-white flex flex-col w-11/12">
                                <p className="truncate text-center">
                                  created vault address
                                </p>
                                <p>{newVault}</p>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </Tab>
                        <Tab
                          key="airdrop"
                          title={
                            <div className="flex flex-row items-center gap-4">
                              <SiVaultwarden />
                              <p>Airdrop Vault</p>
                            </div>
                          }
                        >
                          <div className="flex flex-col items-center justify-between pt-4">
                            <div className="flex flex-col gap-2 bg-[#1C1D1F] mx-auto min-[640px]:w-[580px] max-[640px]:w-[530px] rounded-xl">
                              <div className="flex flex-row justify-center px-2 py-2">
                                <h3 className="text-[24px] font-manrope text-white leading-8">
                                  Create New Airdrop vault
                                </h3>
                              </div>
                              <div className="flex flex-col w-full gap-4">
                                <div className="flex flex-col gap-3 ">
                                  <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                    Vault Type
                                  </label>
                                  <RadioGroup
                                    value={typeSelected}
                                    onValueChange={setTypeSelected}
                                    className="ml-4"
                                  >
                                    <Radio value="NativeSegwit">
                                      <p className="text-white">
                                        Native Segwit
                                      </p>
                                    </Radio>
                                    <Radio value="Taproot">
                                      <p className="text-white">Taproot</p>
                                    </Radio>
                                  </RadioGroup>
                                </div>
                                <div className="flex flex-row gap-4 w-full">
                                  <div className="flex flex-col mx-auto w-1/3 gap-2">
                                    <p className="text-white text-center">
                                      Upload Image
                                    </p>
                                    <input
                                      type="file"
                                      style={{ display: "none" }}
                                      id="upload-button"
                                      ref={fileInput}
                                      accept="image/*"
                                      onChange={uploadFile}
                                    />
                                    <label htmlFor="upload-button">
                                      {avatar.preview ? (
                                        <img
                                          src={avatar.preview}
                                          alt="dummy"
                                          width="160px"
                                          height="160px"
                                          className=""
                                        />
                                      ) : (
                                        <div className="flex flex-col gap-1 rounded-xl bg-[#28292C] w-40 h-40 justify-center items-center hover:brightness-150 duration-300 cursor-pointer">
                                          <AiOutlineUpload
                                            color="white"
                                            size={26}
                                          />
                                          <p className="text-white">Upload</p>
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                  <div className="flex flex-col gap-2 border-l-2 pl-4 ml-2 border-[#28292C] w-2/3">
                                    <div className="flex flex-col gap-1">
                                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                        RuneName
                                      </label>
                                      <input
                                        name="RuneName"
                                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                                        placeholder="UNCOMMONGOODS"
                                        ref={runeNameRef}
                                        onChange={() => onChangeHandler()}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                        Rune Amount
                                      </label>
                                      <input
                                        name="RuneAmount"
                                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                                        placeholder="5000"
                                        ref={runeAmountRef}
                                        onChange={() => onChangeHandler()}
                                      />
                                    </div>
                                    <div className="flex flex-row gap-4 w-full items-center justify-between">
                                      <div className="flex flex-col gap-1 w-2/3">
                                        <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                          Rune Price
                                        </label>
                                        <input
                                          name="initialPrice"
                                          className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                                          placeholder="5000"
                                          ref={runePriceRef}
                                          onChange={() => onChangeHandler()}
                                        />
                                      </div>
                                      <div className="flex flex-col w-1/4">
                                        <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                          Rune Symbol
                                        </label>
                                        <input
                                          name="RuneSymbol"
                                          className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                                          placeholder="$"
                                          ref={runeSymbolRef}
                                          onChange={() => onChangeHandler()}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  className="bg-[#FEE505] rounded-xl px-6 py-3 w-full hover:brightness-150 duration-300 mt-4"
                                  type="submit"
                                  onClick={() => onCreateNewAirdropWallet()}
                                >
                                  <p className="text-black font-manrope text-[18px] font-semibold leading-6 ">
                                    Submit
                                  </p>
                                </button>
                                {transactionID ? (
                                  <a
                                    href={
                                      TEST_MODE
                                        ? `https://mempool.space/testnet/tx/${transactionID}`
                                        : `https://mempool.space/tx/${transactionID}`
                                    }
                                  />
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>

                            {newVault ? (
                              <div className="text-white flex flex-col w-11/12">
                                <p className="truncate text-center">
                                  created vault address
                                </p>
                                <p>{newVault}</p>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </Tab>
                        <Tab
                          key="syndicate"
                          title={
                            <div className="flex flex-row items-center gap-4">
                              <ImShield />
                              <p>Syndicate Vault</p>
                            </div>
                          }
                        >
                          <div className="flex flex-col items-center justify-between pt-4">
                            <div className="flex flex-col gap-2 bg-[#1C1D1F] mx-auto  min-[640px]:w-[600px] max-[640px]:w-[550px] rounded-xl p-3 ">
                              <div className="flex flex-row justify-center px-4 py-2">
                                <h3 className="text-[24px] font-manrope text-white leading-8">
                                  Create New Syndicate Vault
                                </h3>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex flex-col gap-3 ">
                                  <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                    Vault Type
                                  </label>
                                  <RadioGroup
                                    value={typeSelected}
                                    onValueChange={setTypeSelected}
                                    className="ml-4"
                                  >
                                    <Radio value="NativeSegwit">
                                      <p className="text-white">
                                        Native Segwit
                                      </p>
                                    </Radio>
                                    <Radio value="Taproot">
                                      <p className="text-white">Taproot</p>
                                    </Radio>
                                  </RadioGroup>
                                </div>
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-1">
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                      Co-signer
                                    </label>
                                    <textarea
                                      className="bg-[#131416] border-2 border-[#28292C] p-3 rounded-xl text-white"
                                      placeholder="Add co-signer wallet address"
                                      ref={coSignerRef}
                                      onChange={() => onChangeHandler()}
                                    />

                                    {err ? (
                                      <p className="text-red-600">
                                        {err.cosigner}
                                      </p>
                                    ) : (
                                      <></>
                                    )}
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                                      input vault address then press space to
                                      add
                                    </label>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                      Threshold vaule
                                    </label>
                                    <div className="flex flex-row items-center gap-4">
                                      <div className="flex flex-row items-center gap-2 bg-[#131416] border-2 border-[#28292C] rounded-xl focus:outline-none">
                                        <div
                                          className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                                          onClick={() =>
                                            changeCosignerHandler(-1)
                                          }
                                        >
                                          <FaMinus color="gray" size={20} />
                                        </div>
                                        <p className="text-white text-center w-[200px]">
                                          {coSigner}
                                        </p>

                                        <div
                                          className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                                          onClick={() =>
                                            changeCosignerHandler(1)
                                          }
                                        >
                                          <FaPlus color="gray" size={20} />
                                        </div>
                                      </div>
                                      <p className="text-white min-w-[600px]">
                                        Out of {coSignerCount} co-signer
                                      </p>
                                    </div>

                                    {err ? (
                                      <p className="text-red-600">
                                        {err.thresHold}
                                      </p>
                                    ) : (
                                      <></>
                                    )}
                                    <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                                      Number of co-signer to confirm any
                                      transaction
                                    </label>

                                    <Checkbox
                                      radius="lg"
                                      onChange={() => assetsChangeHandler()}
                                      className="mt-4 mb-2"
                                      isSelected={assetsFlag}
                                    >
                                      <p className="text-white">
                                        Use Rune as DAO token?
                                      </p>
                                    </Checkbox>
                                    {assetsFlag ? (
                                      <div className="flex flex-row justify-between gap-4 pt-4 border-t-2 border-[#28292C]">
                                        <div className="flex flex-col mx-auto gap-1">
                                          <p className="text-white text-center">
                                            Upload Image
                                          </p>
                                          <input
                                            type="file"
                                            style={{ display: "none" }}
                                            id="upload-button"
                                            ref={fileInput}
                                            accept="image/*"
                                            onChange={uploadFile}
                                          />
                                          <label htmlFor="upload-button">
                                            {avatar.preview ? (
                                              <img
                                                src={avatar.preview}
                                                alt="dummy"
                                                width="160px"
                                                height="160px"
                                                className=""
                                              />
                                            ) : (
                                              <div className="flex flex-col gap-1 rounded-xl bg-[#28292C] w-40 h-40 justify-center items-center hover:brightness-150 duration-300 cursor-pointer">
                                                <AiOutlineUpload
                                                  color="white"
                                                  size={26}
                                                />
                                                <p className="text-white">
                                                  Upload
                                                </p>
                                              </div>
                                            )}
                                          </label>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              RuneName
                                            </label>
                                            <input
                                              name="RuneName"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="UNCOMMONGOODS"
                                              ref={runeNameRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Amount
                                            </label>
                                            <input
                                              name="RuneAmount"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runeAmountRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Price
                                            </label>
                                            <input
                                              name="initialPrice"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runePriceRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                                              Rune Symbol
                                            </label>
                                            <input
                                              name="RuneSymbol"
                                              className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                                              placeholder="5000"
                                              ref={runeSymbolRef}
                                              onChange={() => onChangeHandler()}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                </div>

                                <button
                                  className="bg-[#FEE505] rounded-xl px-6 py-3 w-full hover:brightness-150 duration-300 mt-10"
                                  type="submit"
                                  onClick={() => onCreateNewSyndicateVault()}
                                >
                                  <div className="flex flex-row gap-4 items-center justify-center">
                                    <FaVault />
                                    <p className="text-black font-manrope text-[14px] font-semibold leading-6 ">
                                      Create New Syndicate vault
                                    </p>
                                  </div>
                                </button>
                                {transactionID ? (
                                  <a
                                    href={
                                      TEST_MODE
                                        ? `https://mempool.space/testnet/tx/${transactionID}`
                                        : `https://mempool.space/tx/${transactionID}`
                                    }
                                  />
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>

                            {newVault ? (
                              <div className="text-white flex flex-col w-11/12">
                                <p className="truncate text-center">
                                  created Vault address
                                </p>
                                <p>{newVault}</p>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </Tab>
                      </Tabs>
                    </CardBody>
                  </Card>
                </div>
              </div>
            ) : (
              <></>
            )}

            {/* Upgrade exist vault */}
            {pageIndex == 2 ? (
              <div className="max-w-full min-[640px]:w-[644px] max-[640px]:w-[594px] py-[2px] bg-gradient-to-br from-[#6D757F] via-[#28292C] to-[#28292C] mx-auto rounded-xl">
                <div className="max-w-full min-[640px]:w-[640px] max-[640px]:w-[590px] mx-auto bg-[#1C1D1F] p-6 rounded-xl">
                  <div className="flex flex-row justify-center px-4 py-5">
                    <h3 className="text-[24px]  font-bold font-manrope text-white leading-8">
                      Update vault
                    </h3>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-row justify-between">
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                            Address:
                          </label>
                          <div className="flex flex-row gap-2 items-center">
                            <p className="w-48 underline underline-offset-4 text-yellow-400 truncate">
                              {" "}
                              {selectedVault?.address}
                            </p>
                            <MdOutlineContentCopy
                              color="gray"
                              className="hover:brightness-150 duration-300 cursor-pointer"
                              onClick={() =>
                                onCopyClipboard(selectedVault?.address)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-row justify-between">
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                            Previous Threshold:
                          </label>
                          <p className="text-gray-400">
                            {" "}
                            {selectedVault?.threshold}
                          </p>
                        </div>
                        <div className="flex flex-row justify-between pb-4 border-b-2 border-[#28292C]">
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                            Previous Co-signer: {` `}{" "}
                          </label>
                          <div className="flex flex-col gap-1 text-gray-400">
                            {selectedVault?.cosigner.map((vault, index) => (
                              <div
                                className="flex flex-row items-center"
                                key={"selectedVault" + index}
                              >
                                <div className="truncate w-48">{vault}</div>
                                <MdOutlineContentCopy
                                  color="gray"
                                  className="hover:brightness-150 duration-300 cursor-pointer"
                                  onClick={() => onCopyClipboard(vault)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <label className="font-manrope text-[18px] font-normal leading-6 text-[#ffffff] mt-5 mr-auto">
                          Update Vault
                        </label>
                        <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200 mt-3">
                          New Co-signer
                        </label>
                        <textarea
                          name="Cosigner"
                          className="bg-[#131416] border-2 border-[#28292C] p-3 rounded-xl text-white "
                          placeholder="ex. 3Eb9zqd..."
                          // ref={newCosigner}
                          ref={coSignerRef}
                          onChange={() => onChangeHandler()}
                        />

                        {err ? (
                          <p className="text-red-600">{err.cosigner}</p>
                        ) : (
                          <></>
                        )}
                      </div>

                      <div className="flex flex-row items-center gap-4">
                        <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200 mt-3">
                          New Co-signer
                        </label>
                        <div className="flex flex-row items-center gap-2 bg-[#131416] border-2 border-[#28292C] rounded-xl focus:outline-none">
                          <div
                            className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                            onClick={() => changeCosignerHandler(-1)}
                          >
                            <FaMinus color="gray" size={20} />
                          </div>
                          <p className="text-white text-center w-[200px]">
                            {coSigner}
                          </p>

                          <div
                            className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                            onClick={() => changeCosignerHandler(1)}
                          >
                            <FaPlus color="gray" size={20} />
                          </div>
                        </div>
                        <p className="text-white min-w-[600px]">
                          Out of {coSignerCount} co-signer
                        </p>
                      </div>
                      <div className="flex flex-col mx-auto gap-1">
                        <p className="text-white text-center">Upload Image</p>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          id="upload-button"
                          ref={fileInput}
                          accept="image/*"
                          onChange={uploadFile}
                        />
                        <label htmlFor="upload-button">
                          {avatar.preview ? (
                            <img
                              src={avatar.preview}
                              alt="dummy"
                              width="160px"
                              height="160px"
                              className=""
                            />
                          ) : (
                            <div className="flex flex-col gap-1 rounded-xl bg-[#28292C] w-40 h-40 justify-center items-center hover:brightness-150 duration-300 cursor-pointer">
                              <AiOutlineUpload color="white" size={26} />
                              <p className="text-white">Upload</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      className="bg-[#FEE505] rounded-xl px-6 py-3 w-full hover:brightness-150 duration-300 mt-4"
                      type="submit"
                      onClick={() => updateWallet()}
                    >
                      <p className="text-black font-manrope text-[14px] font-semibold leading-6 ">
                        Update Vault
                      </p>
                    </button>
                    {transactionID ? (
                      <Link
                        href={
                          TEST_MODE
                            ? `https://mempool.space/testnet/tx/${transactionID}`
                            : `https://mempool.space/tx/${transactionID}`
                        }
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
                <div>
                  {newVault ? "created vault address :" + newVault : ""}
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>
    </>
  );
}
