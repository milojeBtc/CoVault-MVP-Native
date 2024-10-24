"use client";

import WalletContext from "@/app/contexts/WalletContext";
import {
  batchSyndicateTransferController,
  fetchRuneListByAddressController,
  fetchSyndicateWalletsController,
} from "@/app/controller";
import { IErr, IRuneDetail, ISelectOption } from "@/app/utils/_type";
import {
  BatchTypes,
  IAirdropWalletList,
  ISyndicateWalletList,
} from "@/app/utils/utils";
import Notiflix from "notiflix";
import React, { useContext, useEffect, useRef, useState } from "react";

import { MdOutlineContentCopy } from "react-icons/md";
import { useClipboard } from "use-clipboard-copy";

import {
  Tabs,
  Tab,
  Input,
  Button,
  Checkbox,
  Card,
  CardBody,
  CardHeader,
  Link,
  Navbar,
  NavbarContent,
  NavbarItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import Select from "react-dropdown-select";

export default function Syndicate() {
  const [syndicateList, setSyndicateList] = useState<IAirdropWalletList[]>();
  const [coSignerCount, setCoSignerCount] = useState(0);
  const coSignerRef = useRef(null);

  useEffect(() => {
    fetchSyndicateVault();
  }, []);

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

  const [selectedSyndicateWallet, setSelectedSyndicateWallet] =
    useState<ISyndicateWalletList>();

  const fetchSyndicateVault = async () => {
    const result = await fetchSyndicateWalletsController();
    console.log("result ==> ", result);
    if (!result.success) return;
    setSyndicateList(result.payload);
  };

  const [batchIndex, setBatchIndex] = useState(0);
  const syndicateAmountRef = useRef(null);
  const [err, setErr] = useState<IErr>();

  const [runeList, setRuneList] = useState<IRuneDetail[]>();
  const [batchOption, setBatchOption] = useState<ISelectOption[]>();
  const [modalFlag, setModalFlag] = useState(BatchTypes.Ready);
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  // Syndicate
  const batchModalOpenForSyndicate = async (wallet: IAirdropWalletList) => {
    setSelectedSyndicateWallet(wallet);
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
      setBatchOption(tempOption);
      setModalFlag(BatchTypes.Syndicate);
      onOpen();
    } else {
      Notiflix.Notify.failure("No assets in this vault.");
    }
  };
  // End

  // CopyHandler
  const clipboard = useClipboard();
  const onCopyClipboard = (str: string | undefined) => {
    if (!str) return;
    Notiflix.Notify.success("Copied to clipboard.");
    clipboard.copy(str);
  };
  // End

  const onSyndicateBatchFunc = async () => {
    if (
      syndicateAmountRef.current &&
      runeList &&
      selectedSyndicateWallet &&
      batchOption
    ) {
      const unitAmount = (syndicateAmountRef.current as any).value;
      // Notiflix.Notify.success(unitAmount);
      console.log(
        "limit ==> ",
        parseInt(runeList[batchIndex].amount) /
          selectedSyndicateWallet?.edition.length
      );
      if (
        unitAmount >
        parseInt(runeList[batchIndex].amount) /
          selectedSyndicateWallet?.edition.length
      ) {
        Notiflix.Notify.failure("Overload!!");
      } else {
        // Notiflix.Notify.success("Enough");
        console.log("selectedSyndicateWallet Id ==> ", selectedSyndicateWallet);
        console.log("unitAmount ==> ", unitAmount);
        console.log("BatchOption ==> ", runeList[batchIndex]);

        const result = await batchSyndicateTransferController(
          selectedSyndicateWallet._id,
          unitAmount,
          runeList[batchIndex].runeid,
          ordinalPublicKey
        );

        console.log("result ==> ", result);
        if (!result.success) {
          Notiflix.Notify.failure(result.message);
        }

        Notiflix.Notify.success(result.message);
        // else {
        //   const psbtHex = result.payload;
        //   const tempPsbt = Bitcoin.Psbt.fromHex(psbtHex);
        //   const inputCount = tempPsbt.inputCount;
        //   const toSignInputs = [];
        //   for (let i = 0; i < inputCount; i++) {
        //     toSignInputs.push({
        //       index: i,
        //       address: ordinalAddress,
        //     });
        //   }
        //   const signedPsbt = await (window as any).unisat.signPsbt(psbtHex, {
        //     autoFinalized: false,
        //     toSignInputs,
        //   });
        //   const txResult = await updateSyndicateRequest(
        //     selectedSyndicateWallet._id,
        //     signedPsbt,
        //     ordinalPublicKey
        //   );
        //   if (txResult.success) {
        //     Notiflix.Notify.success("Batch transfer successfully.");
        //     Notiflix.Notify.success(txResult.payload);
        //   } else {
        //     Notiflix.Notify.failure(txResult.message);
        //   }
        //   console.log("txResult in batch result ==> ", txResult);
        // }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-white p-6">
      <p className="text-center text-3xl">Syndicate Vault</p>
      <div className="p-6">
        {syndicateList?.length ? (
          syndicateList.map((wallet: IAirdropWalletList, index: number) =>
            wallet.creator.ordinalAddress == ordinalAddress ? (
              <div
                className="flex flex-col gap-3 w-[450px] px-6 rounded-3xl border-2 border-[#2C2C2C] bg-[#1C1D1F] p-4 text-white"
                key={index + "wallet"}
              >
                <div className="flex flex-row gap-4 pb-5 border-b-2 border-b-[#28292C] items-center">
                  <img
                    className="rounded-full p-2 border-2 border-[#28292C] w-[80px] h-[80px]"
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
                <div className="flex flex-row justify-between">
                  <p>Rune Name:</p>
                  <p>{wallet.assets.runeName}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Rune Price:</p>
                  <p>{wallet.assets.initialPrice} sats</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Rune Symbol:</p>
                  <p>{wallet.assets.runeSymbol}</p>
                </div>
                <div className="flex flex-row justify-between mt-4 pb-6 border-b-2 border-[#2C2C2C] mb-4">
                  <p className="mr-10">Editions: </p>
                  {wallet.edition.map((edition, index) => (
                    <div
                      className="truncate bg-[#28292C] ml-2 rounded-xl px-2"
                      key={"cosinger" + index}
                    >
                      {edition}
                    </div>
                  ))}
                </div>
                <div className="flex flex-row justify-around gap-4 mt-2 mb-2">
                  <div
                    className="w-2/5 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => batchModalOpenForSyndicate(wallet)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        Batch Transfer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )
          )
        ) : (
          <>No vault here</>
        )}
      </div>
      {/* Syndicate Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && modalFlag == BatchTypes.Syndicate}
        onClose={onClose}
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
                Batch airdrop in Syndicate
              </ModalHeader>
              <ModalBody>
                <div className="p-2">
                  {runeList ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-row gap-5 items-center">
                        <p>Rune Ticker: </p>
                        {batchOption ? (
                          <Select
                            options={batchOption}
                            onChange={(values) =>
                              setBatchIndex(values[0].value)
                            }
                            className="w-full"
                            values={[batchOption[0]]}
                          />
                        ) : (
                          <></>
                        )}
                      </div>
                      <div className="flex flex-row gap-5 items-center">
                        <p className="mr-7">Balance: </p>
                        <p>{runeList[batchIndex].amount}</p>
                      </div>
                      <div className="flex flex-row gap-5 items-center">
                        <p className="">UnitAmount </p>
                        <Input
                          type="number"
                          variant="underlined"
                          className="text-white text-[20px]"
                          color="primary"
                          ref={syndicateAmountRef}
                          placeholder="200"
                          max={runeList[batchIndex].amount}
                          onChange={() => onChangeHandler()}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="">
                          Edition: {selectedSyndicateWallet?.edition.length}{" "}
                        </p>
                        <div className="flex flex-col gap-2 max-h-[150px] overflow-auto">
                          {selectedSyndicateWallet?.edition.map(
                            (edition: string, index: number) => (
                              <div
                                className="flex flex-row gap-2"
                                key={"edition" + index}
                              >
                                <p className="indent-2">{index}: </p>
                                <p className="truncate">{edition}</p>
                              </div>
                            )
                          )}
                        </div>
                        {err ? (
                          <p className="text-red-600">{err.thresHold}</p>
                        ) : (
                          <></>
                        )}
                      </div>
                      <Button
                        color="warning"
                        variant="flat"
                        onPress={onSyndicateBatchFunc}
                        className="capitalize mt-4"
                      >
                        Batch Transfer
                      </Button>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
