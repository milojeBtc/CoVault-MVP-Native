"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import {
  brc20InscribingController,
  brc20TransferController,
  btcTransferController,
  getBtcAndRuneByAddressController,
  getTapBalanceByAddressController,
  getTransferableInscription,
  multisigDetailsById,
  ordinalTransferController,
  preTapInscribeController,
  runeTransferController,
  tapInscribeController,
  tapOrdinalTransferController,
} from "@/app/controller";
import { useParams, useRouter } from "next/navigation";
import { MdOutlineContentCopy } from "react-icons/md";
import { useClipboard } from "use-clipboard-copy";

import Notiflix from "notiflix";
import {
  IBrc20List,
  IMultisig,
  IOrdinalsList,
  IRuneDetail,
  ISelectOption,
  ITapItemList,
  ITapList,
} from "@/app/utils/_type";

import { Loading } from "@/app/components/Loading";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import Select from "react-dropdown-select";
import { validate, Network } from "bitcoin-address-validation";
import { ORDINAL_URL, TEST_MODE } from "@/app/utils/utils";

import WalletContext from "@/app/contexts/WalletContext";

export default function Page() {
  const { slug } = useParams();
  const {
    setPageIndex,
    walletType,
    ordinalAddress,
    ordinalPublicKey,
    paymentAddress,
    paymentPublicKey,
  } = useContext(WalletContext);
  const [multisigVaultData, setMultisigVaultData] = useState<IMultisig>();
  const [btcBalance, setBtcBalance] = useState<number>();
  const [runeBalanceList, setRuneBalanceList] = useState<IRuneDetail[]>();
  const [ordinalsList, setOrdinalsList] = useState<IOrdinalsList[]>();
  const [brc20List, setBrc20List] = useState<IBrc20List[]>();
  const [tapList, setTapList] = useState<ITapList[]>();

  const [sendInscribe, setsendInscribe] = useState("");
  const [ordinalIndex, setOrdinalIndex] = useState(-1);
  const router = useRouter();

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalFlag, setModalFlag] = useState("BTC");
  const [batchOption, setBatchOption] = useState<ISelectOption[]>();
  const [batchIndex, setBatchIndex] = useState(0);
  const [err, setErr] = useState({
    destination: "",
    amount: "",
    ordinals: "",
  });
  const destRef = useRef(null);
  const amountRef = useRef(null);

  // Loading
  const [loading, setLoading] = useState(false);
  // End

  // ItemList
  // const itemList: ITapItemList[] = [];
  const [itemList, setItemList] = useState<ITapItemList[]>([]);
  // End ItemList

  const onChangeHandler = async () => {
    setErr({
      destination: "",
      amount: "",
      ordinals: "",
    });
  };

  const ordinalsCardHandler = (inscriptionId: string, index: number) => {
    console.log("ordinalsCardHandler is called ==> ", inscriptionId, index);
    setsendInscribe(inscriptionId);
    if (ordinalIndex == index) {
      setOrdinalIndex(-1);
    } else {
      setOrdinalIndex(index);
    }
  };

  const onTransferFunc = async () => {
    try {
      if (!btcBalance) {
        Notiflix.Notify.warning("There is no btc balance in this address");
        return;
      }
      const destination = (destRef.current as any).value;
      const amount: number = (amountRef.current as any).value;

      if (!runeBalanceList || !multisigVaultData) return;

      console.log("onTransferFunc is called!");
      console.log("destination ==> ", destination);
      console.log("amount ==> ", amount);

      if (!destination) {
        setErr({ ...err, destination: "Destination address is required" });
        return;
      }
      if (
        !validate(destination, TEST_MODE ? Network.testnet : Network.mainnet)
      ) {
        setErr({ ...err, destination: "Destination address is invalid." });
        return;
      }

      if (!amount) {
        setErr({ ...err, amount: "Amount is required" });
        return;
      }
      if (amount < 300) {
        setErr({ ...err, amount: "Amount should be more than 300" });
        return;
      }
      if (amount > btcBalance) {
        setErr({ ...err, amount: "Amount should be less than balance" });
        return;
      }

      setErr({
        destination: "",
        amount: "",
        ordinals: "",
      });

      const prefix = multisigVaultData.address.slice(2, 4);
      const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";

      // setLoading(true);
      Notiflix.Loading.hourglass("Generating BTC PSBT...")

      const result = await btcTransferController(
        multisigVaultData?._id,
        destination,
        amount,
        paymentAddress,
        paymentPublicKey,
        vaultType
      );
      console.log("result ==> ", result);

      console.log("<========= All is good!! ==========>");

      Notiflix.Loading.remove();

      if (result.success) {
        Notiflix.Notify.success(
          "The Request for sending Rune is made successfully."
        );
        router.push("/pages/request");
        setPageIndex(3);
      } else Notiflix.Notify.failure("Get failure in building Request.");
    } catch (error) {
      Notiflix.Loading.remove();
    }
  };

  const onOrdinalsTransferFunc = async () => {
    try {
      if (!ordinalsList?.length) {
        Notiflix.Notify.warning("There is no ordinals in this address");
        return;
      }
      const destination = (destRef.current as any).value;

      if (!runeBalanceList || !multisigVaultData) return;

      console.log("onTransferFunc is called!");
      console.log("destination ==> ", destination);

      if (!destination) {
        setErr({ ...err, destination: "Destination address is required" });
        return;
      }
      if (
        !validate(destination, TEST_MODE ? Network.testnet : Network.mainnet)
      ) {
        setErr({ ...err, destination: "Destination address is invalid." });
        return;
      }

      if (ordinalIndex == -1) {
        setErr({ ...err, ordinals: "You need to select ordinals. " });
        return;
      }

      setErr({
        destination: "",
        amount: "",
        ordinals: "",
      });

      const prefix = multisigVaultData.address.slice(2, 4);
      const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";

      // setLoading(true);
      Notiflix.Loading.hourglass("Generating Ordinals PSBT...")

      const result = await ordinalTransferController(
        multisigVaultData?._id,
        destination,
        sendInscribe,
        paymentAddress,
        vaultType
      );
      console.log("result ==> ", result);

      console.log("<========= All is good!! ==========>");

      Notiflix.Loading.remove();

      if (result.success) {
        Notiflix.Notify.success(
          "The Request for sending Ordinals is made successfully."
        );
        router.push("/pages/request");
        setPageIndex(3)
      } else Notiflix.Notify.failure("Get failure in building Request.");
    } catch (error) {
      Notiflix.Loading.remove();
    }
  };

  const onRuneTransferFunc = async () => {
    try {
      const destination = (destRef.current as any).value;
      const amount: number = (amountRef.current as any).value;

      if (!runeBalanceList || !multisigVaultData) return;

      console.log("onTransferFunc is called!");
      console.log("destination ==> ", destination);
      console.log("amount ==> ", amount);
      console.log("RuneId ==> ", runeBalanceList[batchIndex].runeid);

      if (!destination) {
        setErr({ ...err, destination: "Destination address is required" });
        return;
      }
      if (
        !validate(destination, TEST_MODE ? Network.testnet : Network.mainnet)
      ) {
        setErr({ ...err, destination: "Destination address is invalid." });
        return;
      }

      if (!amount) {
        setErr({ ...err, amount: "Amount is required" });
        return;
      }

      if (amount > parseInt(runeBalanceList[batchIndex].amount)) {
        setErr({ ...err, amount: "Amount should be less than balance" });
        return;
      }

      setErr({
        destination: "",
        amount: "",
        ordinals: "",
      });

      const prefix = multisigVaultData.address.slice(2, 4);
      const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";

      // setLoading(true);
      Notiflix.Loading.hourglass("Generating PSBT for rune transfer...")

      const result = await runeTransferController(
        multisigVaultData?._id,
        destination,
        runeBalanceList[batchIndex].runeid,
        amount,
        ordinalAddress,
        ordinalPublicKey,
        vaultType
      );
      console.log("result ==> ", result);

      console.log("<========= All is good!! ==========>");

      Notiflix.Loading.remove();

      if (result.success) {
        Notiflix.Notify.success(
          "The Request for sending Rune is made successfully."
        );
        router.push("/pages/request");
        setPageIndex(3)
      } else Notiflix.Notify.failure("Get failure in building Request.");
    } catch (error) {
      Notiflix.Loading.remove();
    }
  };

  const onBrc20TransferFunc = async () => {
    try {
      const destination = (destRef.current as any).value;
      const amount: number = (amountRef.current as any).value;

      if (!brc20List || !multisigVaultData) return;

      console.log("onTransferFunc is called!");
      console.log("destination ==> ", destination);
      console.log("amount ==> ", amount);
      console.log("RuneId ==> ", brc20List[batchIndex].amount);

      if (!destination) {
        setErr({ ...err, destination: "Destination address is required" });
        return;
      }
      if (
        !validate(destination, TEST_MODE ? Network.testnet : Network.mainnet)
      ) {
        setErr({ ...err, destination: "Destination address is invalid." });
        return;
      }

      if (!amount) {
        setErr({ ...err, amount: "Amount is required" });
        return;
      }

      if (amount > parseInt(brc20List[batchIndex].amount)) {
        setErr({ ...err, amount: "Amount should be less than balance" });
        return;
      }

      setErr({
        destination: "",
        amount: "",
        ordinals: "",
      });

      const prefix = multisigVaultData.address.slice(2, 4);
      const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";

      Notiflix.Loading.hourglass("Loading...");

      const inscribeResult = await brc20InscribingController(
        multisigVaultData._id,
        multisigVaultData.address,
        destination,
        brc20List[batchIndex].ticker,
        amount,
        paymentAddress,
        paymentPublicKey
      );

      console.log("inscribeResult ==> ", inscribeResult);

      let inscribeId = "";

      if (!inscribeResult.success) {
        if (!inscribeResult.payload) {
          Notiflix.Notify.failure(inscribeResult.message);
          return;
        }
        console.log(
          "inscribeResult inscription ID ==> ",
          inscribeResult.payload
        );

        inscribeId = inscribeResult.payload;
      } else {
        console.log("inscribeResult ==> ", inscribeResult.payload.data);

        const inscribeAmount = inscribeResult.payload.data.amount;
        const payAddress = inscribeResult.payload.data.payAddress;

        const payResult = await (window as any).unisat.sendBitcoin(
          payAddress,
          inscribeAmount
        );
        console.log("payResult ==> ", payResult);

        inscribeId = await getTransferableInscription(
          multisigVaultData.address,
          brc20List[batchIndex].ticker,
          amount
        );
        console.log("inscribeId ==> ", inscribeId);
      }

      const result = await brc20TransferController(
        multisigVaultData?._id,
        inscribeId,
        destination,
        brc20List[batchIndex].ticker,
        amount,
        paymentAddress,
        vaultType
      );
      console.log("result ==> ", result);

      console.log("<========= All is good!! ==========>");

      // Notiflix.Loading.remove();;
      Notiflix.Loading.remove();

      if (result.success) {
        Notiflix.Notify.success(
          "The Request for sending Ordinals is made successfully."
        );
        router.push("/pages/request");
        setPageIndex(3)
      } else Notiflix.Notify.failure(result.message);
    } catch (error) {
      Notiflix.Loading.remove();
      Notiflix.Notify.info("You cancel the signing...");
    }
  };

  const onTapTransferFunc = async () => {
    try {
      // const destination = (destRef.current as any).value;
      // const amount: number = (amountRef.current as any).value;

      if (!itemList.length) {
        Notiflix.Notify.failure("You need to add at least one list.");
        return;
      }
      if (!tapList || !multisigVaultData) {
        Notiflix.Notify.failure("multisigVaultDatais undefined.");
        return;
      }

      const prefix = multisigVaultData.address.slice(2, 4);
      const vaultType = prefix == "1p" ? "Taproot" : "NativeSegwit";
      Notiflix.Loading.hourglass("Inscribing tap assets. step 1");
      const preTapInscribe = await preTapInscribeController(
        paymentAddress,
        paymentPublicKey,
        itemList
      );
      if (!preTapInscribe.success) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(preTapInscribe.message);
        return;
      }
      console.log("preTapInscribe ==> ", preTapInscribe);

      const signedHexedPsbt = await (window as any).unisat.signPsbt(
        preTapInscribe.payload.psbt
      );
      Notiflix.Loading.change("Inscribing tap assets. step 2");
      const tapInscribe = await tapInscribeController(
        multisigVaultData.address,
        preTapInscribe.payload.privateKey,
        preTapInscribe.payload.amount,
        preTapInscribe.payload.psbt,
        signedHexedPsbt,
        itemList
      );
      if (!tapInscribe.success) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(tapInscribe.message);
        return;
      }

      const inscriptionId = tapInscribe.payload + "i0";
      console.log("inscriptionId ==> ", inscriptionId);

      // Ordinals Sending
      Notiflix.Loading.change("Inscribing tap assets. step 3");
      const result = await tapOrdinalTransferController(
        multisigVaultData?._id,
        inscriptionId,
        paymentAddress,
        ordinalAddress,
        vaultType
      );
      console.log("<========= All is good!! ==========>");
      if (!result.success) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(result.message);
        return;
      }
      router.push("/pages/request");
      setPageIndex(3)
      Notiflix.Loading.remove();
      Notiflix.Notify.success(result.message);
    } catch (error) {
      console.log("error ==> ", error);
      Notiflix.Loading.remove();
    }
  };

  const onPushItemList = async () => {
    const destination = (destRef.current as any).value;
    const amount: number = (amountRef.current as any).value;

    if (!tapList || !multisigVaultData) return;

    console.log("onTransferFunc is called!");
    console.log("destination ==> ", destination);
    console.log("amount ==> ", amount);
    console.log("RuneId ==> ", tapList[batchIndex].ticker);

    if (!destination) {
      setErr({ ...err, destination: "Destination address is required" });
      Notiflix.Notify.warning("Destination address is required"!);
      return;
    }
    if (!validate(destination, TEST_MODE ? Network.testnet : Network.mainnet)) {
      setErr({ ...err, destination: "Destination address is invalid." });
      Notiflix.Notify.warning("Destination address is invalid."!);
      return;
    }

    if (!amount) {
      setErr({ ...err, amount: "Amount is required" });
      Notiflix.Notify.warning("Destination address is invalid."!);
      return;
    }

    if (amount > parseInt(tapList[batchIndex].overallBalance)) {
      setErr({ ...err, amount: "Amount should be less than balance" });
      return;
    }

    setErr({
      destination: "",
      amount: "",
      ordinals: "",
    });

    // const itemList: ITapItemList[] = [];
    // itemList.push({
    //   tick: tapList[batchIndex].ticker,
    //   amt: amount.toString(),
    //   address: destination,
    // });
    setItemList([
      ...itemList,
      {
        tick: tapList[batchIndex].ticker,
        amt: amount.toString(),
        address: destination,
      },
    ]);
    console.log("itemList ==> ", itemList);

    Notiflix.Notify.success("Added into List successfully"!);
  };

  // Modal

  const openBtcModal = () => {
    setModalFlag("BTC");
    onOpen();
  };

  const openRuneModal = () => {
    console.log("runeBalanceList ==> ", runeBalanceList);
    if (!runeBalanceList || !runeBalanceList.length) {
      Notiflix.Notify.warning("There is no runes in this vault.");
      return;
    }
    const tempOption: ISelectOption[] = [];
    runeBalanceList.map((rune: IRuneDetail, index: number) => {
      tempOption.push({
        value: index,
        label: rune.spacedRune,
        id: rune.runeid,
      });
    });
    console.log("tempOption ==> ", tempOption);
    setModalFlag("Rune");
    setBatchOption(tempOption);
    onOpen();
  };

  const openOrdinalsModal = () => {
    console.log("ordinalsList ==> ", ordinalsList);
    setOrdinalIndex(-1);
    if (!ordinalsList || !ordinalsList.length) {
      Notiflix.Notify.warning("There is no Ordinals in this vault.");
      return;
    }
    setModalFlag("Ordinals");
    onOpen();
  };

  const openBrc20Modal = () => {
    console.log("brc20List ==> ", brc20List);
    if (!brc20List || !brc20List.length) {
      Notiflix.Notify.warning("There is no Brc-20 in this vault.");
      return;
    }
    const tempOption: ISelectOption[] = [];
    brc20List.map((brc20: IBrc20List, index: number) => {
      tempOption.push({
        value: index,
        label: brc20.ticker,
        id: brc20.amount,
      });
    });
    console.log("tempOption ==> ", tempOption);
    setModalFlag("Brc20");
    setBatchOption(tempOption);
    onOpen();
  };

  const openTapModal = () => {
    console.log("tapList ==> ", tapList);
    if (!tapList || !tapList.length) {
      Notiflix.Notify.warning("There is no Tap in this vault.");
      return;
    }
    const tempOption: ISelectOption[] = [];
    tapList.map((tap: ITapList, index: number) => {
      tempOption.push({
        value: index,
        label: tap.ticker,
        id: tap.overallBalance,
      });
    });
    console.log("tempOption ==> ", tempOption);
    setModalFlag("Tap");
    setBatchOption(tempOption);
    onOpen();
  };

  const closeModal = () => {
    Notiflix.Loading.remove();
    onClose();
  };

  // End

  const getMultisigDetailsInfo = async () => {
    try {
      Notiflix.Loading.hourglass("Fetching Multisig info...");
      const result = await multisigDetailsById(slug);
      if (result == undefined) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure("Invalid Multisig ID.");
        router.push("/pages/multisig");
        setPageIndex(3)
        return;
      }
      setMultisigVaultData(result.payload);
      console.log("getMultisigDetailsInfo result ==> ", result);
      Notiflix.Loading.remove();
    } catch (error) {
      Notiflix.Loading.remove();
    }
  };

  const getAssetsByAddress = async () => {
    if (multisigVaultData) {
      Notiflix.Loading.hourglass("Fetching Runes info from Address...");
      const address = multisigVaultData.address;
      const result = await getBtcAndRuneByAddressController(address);
      console.log("result on getAssetsByAddress ==> ", result);
      if (result.success) {
        setBtcBalance(result.payload.btcBalance);
        setRuneBalanceList(result.payload.runeBalance);
        setOrdinalsList(result.payload.ordinalsList);
        setBrc20List(result.payload.brc20List);
      }
      Notiflix.Loading.change("Fetching Tap balance list..");
      const tapBalance = await getTapBalanceByAddressController(address);
      console.log("tapBalance on getAssetsByAddress ==> ", tapBalance);
      if (tapBalance.success) {
        setTapList(tapBalance.payload);
      }
      Notiflix.Loading.remove();
    }
  };

  useEffect(() => {
    getMultisigDetailsInfo();
  }, []);

  useEffect(() => {
    getAssetsByAddress();
  }, [multisigVaultData]);

  const clipboard = useClipboard();
  const onCopyClipboard = (str: string | undefined) => {
    Notiflix.Notify.success("Copied to clipboard.");
    if (!str) return;
    clipboard.copy(str);
  };

  return ordinalAddress ? (
    <>
      <div className="py-20 px-10">
        {multisigVaultData ? (
          <div className="flex flex-col gap-4">
            <div className="mx-auto">
              <img
                src={`/uploads/${multisigVaultData.imageUrl}`}
                className=" h-60"
              />
            </div>
            <div className="flex flex-col mx-auto mt-6 w-1/2 gap-4 rounded-xl p-4 bg-gradient-to-br from-[#1E0F00] via-[#1E0F00] to-[#050200] border-2 border-gray-600">
              <div className="flex w-full mt-2">
                <p className="mx-auto text-white text-2xl border-b border-b-gray-400 px-4">
                  {" "}
                  Info{" "}
                </p>
              </div>
              <div className="flex flex-row justify-between border-b border-b-gray-600 pb-2">
                <p className="text-white">Address: </p>
                <div className="flex flex-row w-1/2 gap-2 items-center">
                  <p className="text-[#FEE505] font-bold truncate underline underline-offset-4">
                    {multisigVaultData.address}
                  </p>
                  <MdOutlineContentCopy
                    className="text-[#5C636C] hover:text-white duration-300 cursor-pointer min-w-5"
                    onClick={() => onCopyClipboard(multisigVaultData.address)}
                  />
                </div>
              </div>
              <div className="flex flex-row justify-between  border-b border-b-gray-600 pb-2">
                <p className="text-white">Cosigner: </p>
                <div className="flex flex-col gap-2 text-white w-1/2">
                  {multisigVaultData.cosigner.map((cosigner: string, index: number) => (
                    <p className="truncate" key={"multisigVaultData"+index}>{cosigner}</p>
                  ))}
                </div>
              </div>
              <div className="flex flex-row justify-between border-b border-b-gray-600 pb-2">
                <p className="text-white">Threshold: </p>
                <p className="text-white">{multisigVaultData.threshold}</p>
              </div>
              <div className="flex flex-row justify-between border-b border-b-gray-600 pb-2">
                <p className="text-white">Created At: </p>
                <p className="text-white truncate w-1/2 text-right">
                  {multisigVaultData.createdAt.split("T")[0]}
                </p>
              </div>

              <div className="flex w-full mt-6">
                <p className="mx-auto text-white text-2xl border-b border-b-gray-400 px-4">
                  {" "}
                  Assets{" "}
                </p>
              </div>

              <div className="flex flex-row justify-between border-b border-b-gray-600 pb-2">
                <p className="text-white">BTC: </p>
                <p className="text-white truncate w-1/2 text-right">
                  {btcBalance ? (
                    <span>{btcBalance.toString()}</span>
                  ) : (
                    <span>0</span>
                  )}
                </p>
              </div>

              {/* Rune */}
              <div className="flex flex-col border-b border-b-gray-600 pb-2">
                <div className="flex flex-row justify-between">
                  <p className="text-white">Rune: </p>
                  {runeBalanceList?.length == 0 ? (
                    <span className="text-white">None</span>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="text-white px-6">
                  {runeBalanceList?.map((rune: IRuneDetail, index: number) => (
                    <div className="flex flex-row justify-between text-white" key={"runeBalanceList"+index}>
                      <p className="">{rune.spacedRune}:</p>
                      <p className="ml-auto">
                        {rune.amount}
                        {rune.symbol}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tap Assets */}
              <div className="flex flex-col border-b border-b-gray-600 pb-2">
                <div className="flex flex-row justify-between">
                  <p className="text-white">TAP: </p>
                  {tapList?.length == 0 ? (
                    <span className="text-white">None</span>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="text-white px-6">
                  {tapList?.length ? (
                    tapList?.map((tap: ITapList, index: number) => (
                      <div className="flex flex-row justify-between text-white" key={"tapList"+ index}>
                        <p className="">{tap.ticker.toUpperCase()}:</p>
                        <p className="ml-auto">{tap.overallBalance}</p>
                      </div>
                    ))
                  ) : (
                    <></>
                  )}
                </div>
              </div>

              <div className="flex flex-col border-b border-b-gray-600 pb-2">
                <div className="flex flex-row justify-between">
                  <p className="text-white">Ordinals: </p>
                  {ordinalsList?.length == 0 ? (
                    <span className="text-white">None</span>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="flex flex-wrap justify-around text-white px-6">
                  {ordinalsList?.map((ordinals: IOrdinalsList, index: number) => (
                    <div className="flex flex-col justify-around text-white w-20 border border-white" key={"ordinalsList"+index}>
                      <img
                        alt="Inscription Image"
                        className="w-20 h-20"
                        src={`${ORDINAL_URL}/${ordinals.inscriptionId}`}
                      />
                      <div className="text-black text-center bg-white text-[16] truncate">
                        {ordinals.inscriptionNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col border-b border-b-gray-600 pb-2">
                <div className="flex flex-row justify-between">
                  <p className="text-white">Brc-20: </p>
                  {brc20List?.length == 0 ? (
                    <span className="text-white">None</span>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="text-white px-6">
                  {brc20List?.map((brc20: IBrc20List, index: number) => (
                    <div className="flex flex-row justify-between text-white" key={"brc20List"+index}>
                      <p className="">{brc20.ticker}:</p>
                      <p className="ml-auto">{brc20.amount}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex w-full mt-6">
                <p className="mx-auto text-white text-2xl border-b border-b-gray-400 px-4">
                  {" "}
                  Action{" "}
                </p>
              </div>

              <div className="flex flex-row gap-10 justify-around">
                <div
                  className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => openBtcModal()}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Send Btc
                    </p>
                  </div>
                </div>
                <div
                  className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => openRuneModal()}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Send Rune
                    </p>
                  </div>
                </div>
                <div
                  className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => openOrdinalsModal()}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Send Ordinals
                    </p>
                  </div>
                </div>
                <div
                  className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => openBrc20Modal()}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Send Brc-20
                    </p>
                  </div>
                </div>
                <div
                  className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => openTapModal()}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Send Tap
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {/* BTC */}
        <Modal
          backdrop="blur"
          isOpen={isOpen && modalFlag == "BTC"}
          onClose={closeModal}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center">
                  BTC Transfer
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col p-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <p>Destination Address</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={destRef}
                        placeholder="bc1puda8c..."
                        onChange={() => onChangeHandler()}
                      />
                      {err.destination ? (
                        <p className="text-red-500">{err.destination}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Transfer Amount</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={amountRef}
                        placeholder="20"
                        onChange={() => onChangeHandler()}
                      />
                      {err.amount ? (
                        <p className="text-red-500">{err.amount}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <Button
                      color="warning"
                      variant="flat"
                      onPress={onTransferFunc}
                      className="capitalize mt-10"
                    >
                      Send
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Rune */}
        <Modal
          backdrop="blur"
          // isOpen={isOpen && editionSelected == "sell"}
          isOpen={isOpen && modalFlag == "Rune"}
          onClose={closeModal}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center">
                  Rune Transfer
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col p-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <p>Ticker</p>
                      {batchOption ? (
                        <Select
                          options={batchOption}
                          onChange={(values) => setBatchIndex(values[0].value)}
                          className="w-full"
                          values={[batchOption[0]]}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Destination Address</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={destRef}
                        placeholder="bc1puda8c..."
                        onChange={() => onChangeHandler()}
                      />
                      {err.destination ? (
                        <p className="text-red-500">{err.destination}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Transfer Amount</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={amountRef}
                        placeholder="20"
                        onChange={() => onChangeHandler()}
                      />
                      {err.amount ? (
                        <p className="text-red-500">{err.amount}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <Button
                      color="warning"
                      variant="flat"
                      onPress={onRuneTransferFunc}
                      className="capitalize mt-10"
                    >
                      Send Rune
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Ordinals */}
        <Modal
          backdrop="blur"
          isOpen={isOpen && modalFlag == "Ordinals"}
          onClose={closeModal}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center">
                  Ordinals Transfer
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col p-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <p>Destination Address</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={destRef}
                        placeholder="bc1puda8c..."
                        onChange={() => onChangeHandler()}
                      />
                      {err.destination ? (
                        <p className="text-red-500">{err.destination}</p>
                      ) : (
                        <></>
                      )}

                      <div className="flex flex-wrap justify-center gap-4 max-h-80 overflow-x-hidden overflow-y-auto">
                        {ordinalsList ? (
                          ordinalsList.map(
                            (ordinal: IOrdinalsList, index: number) => (
                              <div className="relative w-20 h-[104px] mx-auto" key={"IOrdinalsList"+index}>
                                {index == ordinalIndex ? (
                                  <div
                                    className="absolute bottom-0 left-0 right-0 z-10 bg-white bg-opacity-80 animate-pulse top-4"
                                    onClick={() =>
                                      ordinalsCardHandler(
                                        ordinal.inscriptionId,
                                        index
                                      )
                                    }
                                  ></div>
                                ) : (
                                  <></>
                                )}
                                <div
                                  className="relative flex flex-col mt-4 border border-gray-400 cursor-pointer"
                                  onClick={() =>
                                    ordinalsCardHandler(
                                      ordinal.inscriptionId,
                                      index
                                    )
                                  }
                                >
                                  <img
                                    alt="Inscription Image"
                                    className="w-20 h-20"
                                    src={`${ORDINAL_URL}/${ordinal.inscriptionId}`}
                                  />
                                  <div className="text-black text-center bg-white text-[16[px]]">
                                    {ordinal.inscriptionNumber}
                                  </div>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <></>
                        )}
                        {err.ordinals ? (
                          <p className="text-red-500 text-center mt-2">
                            {err.ordinals}
                          </p>
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                    <Button
                      color="warning"
                      variant="flat"
                      onPress={onOrdinalsTransferFunc}
                      className="capitalize mt-10"
                    >
                      Send
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Brc-20 */}
        <Modal
          backdrop="blur"
          // isOpen={isOpen && editionSelected == "sell"}
          isOpen={isOpen && modalFlag == "Brc20"}
          onClose={closeModal}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center">
                  Brc-20 Transfer
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col p-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row justify-between">
                        <p>Ticker</p>
                        <p>
                          Balance:{" "}
                          {batchOption ? batchOption[batchIndex].id : 0}
                        </p>
                      </div>

                      {batchOption ? (
                        <Select
                          options={batchOption}
                          onChange={(values) => setBatchIndex(values[0].value)}
                          className="w-full"
                          values={[batchOption[0]]}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Destination Address</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={destRef}
                        placeholder="bc1puda8c..."
                        onChange={() => onChangeHandler()}
                      />
                      {err.destination ? (
                        <p className="text-red-500">{err.destination}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Transfer Amount</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={amountRef}
                        placeholder="20"
                        onChange={() => onChangeHandler()}
                      />
                      {err.amount ? (
                        <p className="text-red-500">{err.amount}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <Button
                      color="warning"
                      variant="flat"
                      onPress={onBrc20TransferFunc}
                      className="capitalize mt-10"
                    >
                      Send Brc-20
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* Tap */}
        <Modal
          backdrop="blur"
          // isOpen={isOpen && editionSelected == "sell"}
          isOpen={isOpen && modalFlag == "Tap"}
          onClose={closeModal}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
          classNames={{
            body: "py-6",
            backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
            base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
            header: "border-b-[1px] border-[#292f46]",
            footer: "border-t-[1px] border-[#292f46]",
            closeButton: "hover:bg-white/5 active:bg-white/10",
          }}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center">
                  Tap Transfer
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col p-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row justify-between">
                        <p>Ticker</p>
                        <p>
                          Balance:{" "}
                          {batchOption ? batchOption[batchIndex].id : 0}
                        </p>
                      </div>

                      {batchOption ? (
                        <Select
                          options={batchOption}
                          onChange={(values) => setBatchIndex(values[0].value)}
                          className="w-full"
                          values={[batchOption[0]]}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Destination Address</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={destRef}
                        placeholder="bc1puda8c..."
                        onChange={() => onChangeHandler()}
                      />
                      {err.destination ? (
                        <p className="text-red-500">{err.destination}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Transfer Amount</p>
                      <input
                        className="bg-[#131416] border-2 border-[#28292C] p-2 rounded-lg text-white"
                        ref={amountRef}
                        placeholder="20"
                        onChange={() => onChangeHandler()}
                      />
                      {err.amount ? (
                        <p className="text-red-500">{err.amount}</p>
                      ) : (
                        <></>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <p>ItemList</p>
                      {itemList.length ? (
                        itemList.map((list: ITapItemList, index: number) => (
                          <div className="flex flex-col gap-2" key={"ItemList"+index}>
                            <div className="flex flex-row gap-2">
                              <p>No: {index}</p>
                              <p>Ticker: {list.tick}</p>
                              <p>Amount: {list.amt}</p>
                            </div>
                            <p className="w-full truncate">Address: {list.address}</p>
                          </div>
                        ))
                      ) : (
                        <></>
                      )}
                    </div>
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={onPushItemList}
                      className="capitalize mt-10"
                    >
                      Add to list
                    </Button>

                    <Button
                      color="warning"
                      variant="flat"
                      onPress={onTapTransferFunc}
                      className="capitalize mt-2"
                    >
                      Send Tap
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
      {loading ? <Loading /> : <></>}
    </>
  ) : (
    <div className="text-white flex justify-center mt-10">
      Plz Connect wallet first...
    </div>
  );
}
