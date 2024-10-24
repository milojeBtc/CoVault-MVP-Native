"use client";

import WalletContext from "@/app/contexts/WalletContext";
import {
  cancelRequestPsbtController,
  fetchRequestPsbtController,
  fetchRequestListController,
  updateRequestPsbtController,
} from "@/app/controller";
import { IRequest } from "@/app/utils/utils";
import { Psbt } from "bitcoinjs-lib";
import Notiflix from "notiflix";
import React, { useContext, useEffect, useState } from "react";
import { MdOutlineContentCopy } from "react-icons/md";
import { useClipboard } from "use-clipboard-copy";

export default function Page() {
  const [requestList, setRequestList] = useState<IRequest[]>();
  const [selectedRequest, setSelectedRequest] = useState<IRequest>();

  const { paymentPublicKey } = useContext(WalletContext);

  // CopyHandler
  const clipboard = useClipboard();
  const onCopyClipboard = (str: string | undefined) => {
    if (!str) return;
    Notiflix.Notify.success("Copied to clipboard.");
    clipboard.copy(str);
  };
  // End

  const fetchRequestList = async () => {
    console.log("fetchRequestList ==> ");
    Notiflix.Loading.hourglass("Fetching Request List...");
    const requestResponse = await fetchRequestListController();
    if (!requestResponse) {
      Notiflix.Loading.remove();
      return;
    }
    setRequestList(requestResponse);
    Notiflix.Loading.remove();
  };

  const updateBSRequestHandler = async (request: IRequest) => {
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
    console.log("fetchBSRequestPsbtController ==> ", result);
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
        if (result.success) {
          Notiflix.Notify.success(result.message);
          if (result.message == "Transaction broadcasting successfully.") {
            Notiflix.Notify.success(result.payload);
          }
          await fetchRequestList();
        } else {
            Notiflix.Notify.failure(result.message);
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

  useEffect(() => {
    fetchRequestList();
  }, [paymentPublicKey]);

  return paymentPublicKey ? (
    <div className="flex flex-col gap-10 mt-20 min-h-[100vh-30px]">
      <p className="w-full text-center text-4xl text-yellow-300">
        Batch Sending Vault Request
      </p>
      <div className="flex flex-wrap mx-4 items-start justify-between pt-4 gap-4">
        {requestList?.length ? (
          requestList.map((request: IRequest, index: number) => (
            <div
              className="max-w-full min-[640px]:w-[494px] max-[640px]:w-[454px] py-[2px] bg-gradient-to-br from-[#6D757F] via-[#28292C] to-[#28292C] mx-auto rounded-xl text-white"
              key={"requestList" + index}
            >
              <div className="flex flex-col gap-2 max-w-full min-[640px]:w-[490px] max-[640px]:w-[440px] mx-auto bg-[#1C1D1F] p-6 rounded-xl">
                <div className="text-white text-[20px] text-center mb-6">
                  Request
                </div>
                <div className="flex flex-row justify-between">
                  <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                    Type
                  </label>
                  <label>{request.type}</label>
                </div>
                <div className="flex flex-row justify-between">
                  <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                    Previous Co-signer: {` `}{" "}
                  </label>
                  <div className="flex flex-col gap-1 text-gray-400">
                    {request.cosigner.map((cosigner, index) => (
                      <div
                        className="flex flex-row items-center"
                        key={"request" + index}
                      >
                        <div className="truncate w-48">{cosigner}</div>
                        <MdOutlineContentCopy
                          color="gray"
                          className="hover:brightness-150 duration-300 cursor-pointer"
                          onClick={() => onCopyClipboard(cosigner)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                    Signed Co-signer: {` `}{" "}
                  </label>
                  <div className="flex flex-col gap-1 text-gray-400">
                    {request.signedCosigner.map((cosigner, index) => (
                      <div
                        className="flex flex-row items-center"
                        key={"request" + index}
                      >
                        <div className="truncate w-48">{cosigner}</div>
                        <MdOutlineContentCopy
                          color="gray"
                          className="hover:brightness-150 duration-300 cursor-pointer"
                          onClick={() => onCopyClipboard(cosigner)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <label className="font-manrope text-[14px] font-normal leading-6 text-gray-200">
                    Creator: {` `}{" "}
                  </label>
                  <div
                    className="flex flex-row items-center text-gray-400"
                    key={"request" + index}
                  >
                    <div className="truncate w-48">{request.creator}</div>
                    <MdOutlineContentCopy
                      color="gray"
                      className="hover:brightness-150 duration-300 cursor-pointer"
                      onClick={() => onCopyClipboard(request.creator)}
                    />
                  </div>
                </div>
                <div className="pb-4 mb-4 border-b-2 border-[#28292C]">
                  Threshold: {request.threshold}
                </div>
                <div
                  className="w-2/5 border-[#FEE505] text-center bg-[#2E2D1D] p-2 rounded-lg mt-auto mx-auto border cursor-pointer hover:brightness-150 duration-300"
                  onClick={() => updateBSRequestHandler(request)}
                >
                  Sign
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center mt-40 text-white text-xl pb-20 mb-4">
            There is no Batch Sending Vault Request
          </div>
        )}
      </div>
    </div>
  ) : (
    <p className="text-white text-[24px] text-center pt-40">
      Connect Wallet first...
    </p>
  );
}