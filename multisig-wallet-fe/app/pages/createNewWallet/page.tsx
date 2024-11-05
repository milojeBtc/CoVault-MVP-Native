"use client";

import React, { useContext, useEffect, useRef, useState } from "react";

import {
  Checkbox,
  Card,
  CardBody,
  RadioGroup,
  Radio,
} from "@nextui-org/react";
import { validate, Network } from 'bitcoin-address-validation';
import Notiflix from "notiflix";
import { useRouter } from "next/navigation";

import { FaMinus, FaPlus, FaVault } from "react-icons/fa6";
import { AiOutlineUpload } from "react-icons/ai";

import { IErr, IRuneAssets } from "@/app/utils/_type";
import WalletContext from "@/app/contexts/WalletContext";
import { TEST_MODE } from "@/app/utils/utils";
import { createNewVaultController, getFeeLevelController, usdToBtcController } from "@/app/controller";
import { WalletTypes } from "@/app/utils/_type";
import { DEPLOY_FEE, DEPLOY_FEE_VIP } from "@/app/utils/constant";
import { FEE_ADDRESS } from "@/app/utils/serverAddress";
// import { useBitcoin } from "@kondor-finance/zky-toolkit";
import {
  request,
  BitcoinNetworkType,
  signTransaction,
  SignTransactionOptions,
  RpcErrorCode,
} from "sats-connect";

export default function Page() {

  const router = useRouter();

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

  const vaultNameRef = useRef(null);
  const coSignerRef = useRef(null);
  const runeNameRef = useRef(null);
  const runeAmountRef = useRef(null);
  const runePriceRef = useRef(null);
  const runeSymbolRef = useRef(null);

  const [avatar, setAvatar] = useState({
    preview: "",
  });

  const { walletType, ordinalAddress, ordinalPublicKey, paymentAddress, paymentPublicKey } =
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
      const length = str.split("\n").filter(value => value && validate(value, (TEST_MODE ? Network.testnet : Network.mainnet))).length;
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

      let vaultName;
      if (vaultNameRef.current) vaultName = vaultNameRef.current["value"];

      if(!vaultName) {
        Notiflix.Notify.failure("The Vault Name is required.");
        return
      }

      if((vaultName as string).length < 4 || (vaultName as string).length > 30){
        Notiflix.Notify.failure("The Vault Name should be between 4 and 30 letters");
        return
      }

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

      const unallowedAddressIndexList: number[] = [];
      cosignerList.map((value: string, index: number) => {
        if (!value || !validate(value, (TEST_MODE ? Network.testnet : Network.mainnet))) {
          unallowedAddressIndexList.push(index + 1);
        }
      });

      if (unallowedAddressIndexList.length) {
        Notiflix.Notify.warning(`${unallowedAddressIndexList.toString()}th address is invalid.`);
        return
      }

      Notiflix.Loading.hourglass("Uploading images...");

      // Pay the fee for deploy
      const feeLevel = await getFeeLevelController(ordinalAddress);
      console.log("feeLevel ==> ", feeLevel);
      const satsAmount = await usdToBtcController(feeLevel ? DEPLOY_FEE_VIP : DEPLOY_FEE);
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
          const response = await request("sendTransfer", {
            recipients: [
              {
                address: FEE_ADDRESS,
                amount: Number((satsAmount / Math.pow(10, 8))),
              },
            ],
          });
          console.log("response in xverse ==> ", response);
          if (response.status === "success") {
            payingFeeTxid = response.result.txid;
          } else {
            if (response.error.code === RpcErrorCode.USER_REJECTION) {
              // handle user cancellation error
              Notiflix.Notify.warning("You reject the signing.");
            } else {
              // handle error
              console.log("xverse signing error ==> ");
            }
          }
        default:
          break;
      }

      if (!payingFeeTxid) {
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

      Notiflix.Loading.change("Creating New Vault...");
      const result = await createNewVaultController(
        vaultName,
        cosignerList,
        thresHoldValue,
        assets,
        imageUrl,
        typeSelected,
        walletType, ordinalAddress, ordinalPublicKey, paymentAddress, paymentPublicKey
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

  useEffect(() => {
    if(!ordinalAddress) {
      Notiflix.Notify.failure("Wallet Connect First..");
      router.push("/")
      return
    }
  }, []);

  // End
  return paymentAddress ? (
    <div className="flex flex-col w-full mt-40">
      <div className="max-w-full min-[640px]:w-[644px] max-[640px]:w-[594px] py-[2px] bg-gradient-to-br from-[#6D757F] via-[#28292C] to-[#28292C] mx-auto rounded-xl mb-20">
        <Card className="max-w-full min-[640px]:w-[640px] max-[640px]:w-[590px] mx-auto bg-[#1C1D1F] p-3">
          <CardBody className="overflow-hidden">
            <div className="flex flex-col items-center justify-between pt-4">
              <div className="flex flex-col gap-2 bg-[#1C1D1F] mx-auto  min-[640px]:w-[600px] max-[640px]:w-[550px] rounded-xl p-3">
                <div className="flex flex-row justify-center px-4 py-2">
                  <h3 className="text-[24px] font-manrope text-white leading-8">
                    Create New vault
                  </h3>
                </div>
                <div className="flex flex-col mt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 mt-10">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Vault Name
                      </label>
                      <input
                        type="text"
                        className="bg-[#131416] border-2 border-[#28292C] p-3 rounded-xl text-white"
                        placeholder="Type new vault name."
                        ref={vaultNameRef}
                        onChange={() => onChangeHandler()}
                      />

                      {err ? (
                        <p className="text-red-600">{err.cosigner}</p>
                      ) : (
                        <></>
                      )}
                      <label className="font-manrope text-[14px] font-normal leading-6 text-gray-500">
                        Name should be between 4 letters and 30 letters.
                      </label>
                    </div>
                    <div className="flex flex-row w-full items-start">
                      <div className="flex flex-col gap-3 w-1/2">
                        <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                          Vault Type
                        </label>
                        <RadioGroup
                          value={typeSelected}
                          onValueChange={setTypeSelected}
                          className="ml-4 mt-6 gap-10"
                        >
                          <Radio value="NativeSegwit">
                            <p className="text-white">Native Segwit</p>
                          </Radio>
                          <Radio value="Taproot">
                            <p className="text-white">Taproot</p>
                          </Radio>
                        </RadioGroup>
                      </div>
                      <div className="flex flex-col justify-center gap-1 w-1/2">
                        <p className="text-white">
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
                              className="flex mx-auto"
                            />
                          ) : (
                            <div className="flex flex-col gap-1 rounded-xl bg-[#28292C] w-40 h-40 justify-center items-center hover:brightness-150 duration-300 cursor-pointer mx-auto mt-4">
                              <AiOutlineUpload
                                color="white"
                                size={26}
                              />
                              <p className="text-white">Upload</p>
                            </div>
                          )}
                        </label>
                      </div>

                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Co-signer Address
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
                      <p className="text-black font-manrope text-[14px] font-semibold leading-6">
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
