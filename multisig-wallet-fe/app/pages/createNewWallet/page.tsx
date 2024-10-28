"use client";

import React, { useContext, useRef, useState } from "react";

import {
  Tabs,
  Tab,
  Checkbox,
  Card,
  CardBody,
  RadioGroup,
  Radio,
} from "@nextui-org/react";
import { FaMinus, FaPlus, FaVault } from "react-icons/fa6";
import { IErr, IRuneAssets } from "@/app/utils/_type";
import { AiOutlineUpload } from "react-icons/ai";
import WalletContext from "@/app/contexts/WalletContext";
import Notiflix from "notiflix";
import { TEST_MODE } from "@/app/utils/utils";
import { createNewVault, getFeeLevelController, usdToBtcController } from "@/app/controller";
import { WalletTypes } from "@/app/utils/_type";
import { DEPLOY_FEE, DEPLOY_FEE_VIP } from "@/app/utils/constant";
import { FEE_ADDRESS } from "@/app/utils/serverAddress";
import { useBitcoin } from "@kondor-finance/zky-toolkit";

export default function Page() {
  const { signMessage, signPsbt, sendTransfer } = useBitcoin();
  const [selected, setSelected] = useState("multi");
  // CreateNewVault
  const [coSignerCount, setCoSignerCount] = useState(0);
  const [coSigner, setCoSigner] = useState(0);
  const changeCosignerHandler = async (index: number) => {
    const temp = Math.min(Math.max(coSigner + index, 0), coSignerCount);
    console.log("temp ==> ", temp);
    setCoSigner(temp);
  };
  const [assetsFlag, setAssetsFlag] = useState(false);
  const [typeSelected, setTypeSelected] = useState("NativeSegwit");
  const [err, setErr] = useState<IErr>();

  const [transactionID, setTransactionID] = useState("");
  const [newVault, setNewVault] = useState<string>("");

  const coSignerRef = useRef(null);
  const runeNameRef = useRef(null);
  const runeAmountRef = useRef(null);
  const runePriceRef = useRef(null);
  const runeSymbolRef = useRef(null);

  const [avatar, setAvatar] = useState({
    preview: "",
  });

  const { walletType, ordinalAddress, paymentAddress } =
    useContext(WalletContext);

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

  const assetsChangeHandler = async () => {
    setAssetsFlag((flag) => !flag);
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

      Notiflix.Loading.hourglass("Uploading images...");

      // Pay the fee for deploy
      const feeLevel = await getFeeLevelController(ordinalAddress);
      console.log("feeLevel ==> ", feeLevel);
      const satsAmount = await usdToBtcController(feeLevel ?  DEPLOY_FEE_VIP : DEPLOY_FEE);
      console.log("DEPLOY SATS AMOUNT ==> ", satsAmount);

      let payingFeeTxid = "";

      switch (walletType) {
        case WalletTypes.UNISAT:
          payingFeeTxid = await (window as any).unisat.sendBitcoin(
            FEE_ADDRESS,
            satsAmount
          );
          console.log("payingFeeTxid ==> ", payingFeeTxid);
          break;
        case WalletTypes.XVERSE:
          console.log("Paying fee with Xverse wallet.")
          await sendTransfer(FEE_ADDRESS, (satsAmount / Math.pow(10, 8)).toString())
            .then((txId) => {
              payingFeeTxid = txId;
              console.log("Transaction successful with ID:", txId);
            })
            .catch((error) => {
              console.log("error ==> ", error);
            });
        default:
          break;
      }

      if(!payingFeeTxid) {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure("Paying Fee is failed.");
        return
      }
      // End pay fee

      const formData = new FormData();
      formData.append("file", fileInput?.current?.files?.[0]!);

      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const updateResult = await response.json();
      console.log("updateResult ==> ", updateResult);
      if (!updateResult.success) {
        Notiflix.Notify.failure("Get error while uploading image.");
        return;
      }
      // return
      const imageUrl = updateResult.payload;
      // if (thresHold.current) thresHoldValue = thresHold.current["value"];
      if (!coSignerCount) return;
      const thresHoldValue = coSignerCount.toString();

      console.log("walletType ==> ", walletType);

      // if (walletType == WalletTypes.UNISAT) {
      Notiflix.Loading.change("Creating New Vault...");
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

      Notiflix.Loading.remove();
      // } else {

      // }
    } catch (error) {
      console.log("submit ==> ", error);
      Notiflix.Loading.remove();
    }
  };

  // End
  return paymentAddress ? (
    <div className="flex flex-col w-full mt-20">
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
                              <p className="text-white">Native Segwit</p>
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
                            <p className="text-red-600">{err.cosigner}</p>
                          ) : (
                            <></>
                          )}
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                            input vault address then press space to add
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

                          {err ? (
                            <p className="text-red-600">{err.thresHold}</p>
                          ) : (
                            <></>
                          )}
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                            Number of co-signer to confirm any transaction
                          </label>

                          <Checkbox
                            radius="lg"
                            onChange={() => assetsChangeHandler()}
                            className="mt-4 mb-2"
                            isSelected={assetsFlag}
                          >
                            <p className="text-white">Use Rune as DAO token?</p>
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
                                      <p className="text-white">Upload</p>
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
              {/* <Tab
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
                            <p className="text-white">Native Segwit</p>
                          </Radio>
                          <Radio value="Taproot">
                            <p className="text-white">Taproot</p>
                          </Radio>
                        </RadioGroup>
                      </div>
                      <div className="flex flex-row gap-4 w-full">
                        <div className="flex flex-col mx-auto w-1/3 gap-2">
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
                          href={`https://mempool.space/testnet/tx/${transactionID}`}
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
                            <p className="text-white">Native Segwit</p>
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
                            <p className="text-red-600">{err.cosigner}</p>
                          ) : (
                            <></>
                          )}
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                            input vault address then press space to add
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

                          {err ? (
                            <p className="text-red-600">{err.thresHold}</p>
                          ) : (
                            <></>
                          )}
                          <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                            Number of co-signer to confirm any transaction
                          </label>

                          <Checkbox
                            radius="lg"
                            onChange={() => assetsChangeHandler()}
                            className="mt-4 mb-2"
                            isSelected={assetsFlag}
                          >
                            <p className="text-white">Use Rune as DAO token?</p>
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
                                      <p className="text-white">Upload</p>
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
                          href={`https://mempool.space/testnet/tx/${transactionID}`}
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
              </Tab> */}
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  ) : (
    <div className="flex justify-center text-white mt-10">
      Plz Connect wallet first...
    </div>
  );
}
