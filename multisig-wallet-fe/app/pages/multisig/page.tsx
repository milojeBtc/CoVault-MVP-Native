"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Notiflix from "notiflix";
import { useClipboard } from "use-clipboard-copy";

import WalletContext from "@/app/contexts/WalletContext";
import { fetchVaultController, updateVault } from "@/app/controller";
import { IErr } from "@/app/utils/_type";
import { IWalletList, TEST_MODE, WalletTypes } from "@/app/utils/utils";
import { AiOutlineUpload } from "react-icons/ai";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { MdOutlineContentCopy } from "react-icons/md";

import { useRouter } from "next/navigation";

export default function Page() {
  useEffect(() => {
    setPageIndex(0);
    fetchWallets();
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

  const coSignerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [walletList, setWalletList] = useState<IWalletList[]>();
  const [taprootWalletList, setTaprootWalletList] = useState<IWalletList[]>();
  const isConnected = Boolean(ordinalAddress);
  const [selectedVault, setSelectedVault] = useState<IWalletList>();

  const [err, setErr] = useState<IErr>();
  const [coSignerCount, setCoSignerCount] = useState(0);
  const [coSigner, setCoSigner] = useState(0);
  const [newVault, setNewVault] = useState<string>("");
  const [transactionID, setTransactionID] = useState("");

  const router = useRouter();

  const fetchWallets = async () => {
    try {
      console.log("fetch wallets ==>");
      Notiflix.Loading.hourglass("Fetching the vaults data...");
      // setLoading(true);

      const result = await fetchVaultController();
      console.log("result ==> ", result);
      if (result.success) {
        Notiflix.Notify.success(result.message);
        setWalletList(result.payload.native);
        console.log("Native Address ==> ", result.payload.native);
        console.log("Taproot Address ==> ", result.payload.taproot);
        setTaprootWalletList(result.payload.taproot);
      } else {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(result.message);
      }
      Notiflix.Loading.remove();
      setLoading(false);
    } catch (error) {
      Notiflix.Loading.remove();
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

  const updateHandler = async (wallet: IWalletList) => {
    setPageIndex(2);
    setSelectedVault(wallet);
  };

  const changeCosignerHandler = async (index: number) => {
    const temp = Math.min(Math.max(coSigner + index, 0), coSignerCount);
    console.log("temp ==> ", temp);
    setCoSigner(temp);
  };

  const clipboard = useClipboard();
  const onCopyClipboard = (str: string | undefined) => {
    Notiflix.Notify.success("Copied to clipboard.");
    if (!str) return;
    clipboard.copy(str);
  };

  const [avatar, setAvatar] = useState({
    preview: "",
  });

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
        Notiflix.Loading.hourglass("Fetching the vaults data...");
        const result = await updateVault(
          selectedVault,
          cosignerList,
          parseInt(thresHoldValue),
          ordinalAddress,
          imageUrl
        );
        console.log("New Vault on updateWallet==> ", result);
        if (result.success) {
          Notiflix.Loading.remove();
          Notiflix.Notify.success(result.message);
          setNewVault(result.payload);
        } else {
          Notiflix.Loading.remove();
          Notiflix.Notify.failure(result.message);
        }

        console.log(result.payload);
      }
    } catch (error) {
      Notiflix.Loading.remove();
      console.log("submit ==> ", error);
    }
  };

  const detailsHandler = async (id: string) => {
    router.push("/pages/multisig/" + id);
  };

  return isConnected ? (
    pageIndex == 0 ? (
      <div className="flex flex-col">
        <p className="text-white text-[24px] text-center mt-6 mb-4">
          Native Segwit Vault
        </p>
        <div className="flex flex-wrap mx-4 items-start justify-around pt-4 gap-4">
          {walletList?.length ? (
            walletList.map((wallet: IWalletList, index: number) =>
              wallet.cosigner.includes(ordinalPublicKey) ? (
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
                  <div
                    className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => detailsHandler(wallet._id)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        More details
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )
            )
          ) : (
            <div className="text-white"></div>
          )}
        </div>

        <p className="text-white text-[24px] text-center mt-6 mb-4">
          Taproot Vault
        </p>
        <div className="flex flex-wrap mx-4 items-start justify-around pt-4 gap-4">
          {taprootWalletList?.length ? (
            taprootWalletList.map((wallet: IWalletList, index: number) =>
              wallet.cosigner.includes(ordinalPublicKey) ? (
                <div
                  className="flex flex-col gap-3 w-[450px] px-6 rounded-3xl border-2 border-[#2C2C2C] bg-[#1C1D1F] p-4 text-white"
                  key={index + "taprootWalletList"}
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
                  <div
                    className="w-full rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1C1D1F] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => detailsHandler(wallet._id)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        More details
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )
            )
          ) : (
            <div className="text-white">There is no taproot vault here</div>
          )}
        </div>
      </div>
    ) : pageIndex == 2 ? (
      <div className="max-w-full min-[640px]:w-[644px] max-[640px]:w-[594px] py-[2px] bg-gradient-to-br from-[#6D757F] via-[#28292C] to-[#28292C] mx-auto rounded-xl mt-16">
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
                      onClick={() => onCopyClipboard(selectedVault?.address)}
                    />
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                    Previous Threshold:
                  </label>
                  <p className="text-gray-400"> {selectedVault?.threshold}</p>
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

                {err ? <p className="text-red-600">{err.cosigner}</p> : <></>}
              </div>

              <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200 mt-3">
                New Threshold
              </label>
              <div className="flex flex-row items-center gap-4 -mt-2">
                <div className="flex flex-row items-center gap-2 bg-[#131416] border-2 border-[#28292C] rounded-xl focus:outline-none">
                  <div
                    className="w-[40px] h-[40px] flex justify-center items-center cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => changeCosignerHandler(-1)}
                  >
                    <FaMinus color="gray" size={20} />
                  </div>
                  <p className="text-white text-center w-[200px]">{coSigner}</p>

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
              <div className="flex flex-col gap-1">
                <p className="text-white">Upload Image</p>
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
                href={TEST_MODE ? `https://mempool.space/testnet/tx/${transactionID}` : `https://mempool.space/tx/${transactionID}`}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
        <div>{newVault ? "created vault address :" + newVault : ""}</div>
      </div>
    ) : (
      <></>
    )
  ) : (
    <div className="text-white text-center mt-10">Plz Connect wallet first</div>
  );
}
