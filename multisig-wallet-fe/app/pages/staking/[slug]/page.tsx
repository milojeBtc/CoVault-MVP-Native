"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  approveClaimRequestController,
  claimApproveBroadcastingController,
  fetchClaimRequestListController,
  fetchVaultDetailsController,
} from "@/app/controller";
import Notiflix from "notiflix";
import { IClaimRequest, IRuneDetail } from "@/app/utils/_type";
import { Button } from "@nextui-org/react";
import { Psbt } from "bitcoinjs-lib";
import WalletContext from "@/app/contexts/WalletContext";

export default function Page() {
  const {
    paymentAddress,
    paymentPublicKey,
  } = useContext(WalletContext);

  const { slug } = useParams();

  const [claimRequestList, setClaimRequestList] = useState<IClaimRequest[]>();
  const [vaultData, setVaultData] = useState();
  const [rewardRuneData, setRewardRuneData] = useState<IRuneDetail>();
  const [btcBalance, setBtcBalance] = useState<number>(0);

  const fetchClaimRequestList = async () => {
    Notiflix.Loading.hourglass("Fetching claim requestList ...");
    const result = await fetchClaimRequestListController(slug);
    // Notiflix.Loading.hourglass("Fetching Claim Request List...");
    if (result.success) {
      Notiflix.Loading.remove();
      Notiflix.Notify.success("Fetching Claim Request Successfully.");
      setClaimRequestList(result.payload);
    } else {
      Notiflix.Loading.remove();
      Notiflix.Notify.failure(result.message);
    }
    await fetchVaultDetails();
  };

  const fetchVaultDetails = async () => {
    Notiflix.Loading.hourglass("Fetching Details Info from Vault ...");
    const result = await fetchVaultDetailsController(slug);
    console.log("Vault Details Info ==> ", result);
    if (result.success) {
      setVaultData(result.payload.vauldDetails);
      setRewardRuneData(result.payload.runeBalance);
      setBtcBalance(result.payload.btcBalance)
      Notiflix.Loading.remove();
      Notiflix.Notify.success(result.payload.message);
    } else {
      Notiflix.Loading.remove();
      Notiflix.Notify.failure(result.message);
    }
  };

  const onApproveClaimRequest = async () => {
    try {
      if (!rewardRuneData) {
        Notiflix.Notify.failure("There is no reward Rune Data!");
        return;
      }
      const childIdList = claimRequestList?.map((list) => list.childId);
      console.log("childIdList ==> ", childIdList);
      if (!childIdList?.length) {
        Notiflix.Notify.failure("There is no child Id List.");
        return;
      }
      let totalRewardAmount = 0;
      claimRequestList?.map((list: IClaimRequest, index: number) => {
        totalRewardAmount += list.rewardAmount;
      });

      if (totalRewardAmount > parseInt(rewardRuneData.amount)) {
        Notiflix.Notify.failure(
          "There is not enough rune balance in this vault!"
        );
        return;
      }
      Notiflix.Loading.hourglass("Approving claim Request...");
      const result = await approveClaimRequestController(slug);

      console.log("result ==> ", result);
      if (result.success) {
        Notiflix.Notify.success(result.message);
        // const signedPsbt = await (window as any).unisat.signPsbt(result.payload, { autoFinalized: false });
        const tempPsbt = Psbt.fromHex(result.payload);
        const inputCount = tempPsbt.inputCount;
        const inputArray = Array.from({ length: inputCount }, (_, i) => i);
        console.log("inputArray ==> ", inputArray);
        const toSignInputs: {
          index: number;
          publicKey: string;
          //   disableTweakSigner: boolean;
        }[] = [];
        inputArray.map((value: number) =>
          toSignInputs.push({
            index: value,
            publicKey: paymentPublicKey,
            // disableTweakSigner: true,
          })
        );
        console.log("toSignInputs ==> ", toSignInputs);
        Notiflix.Loading.change("Signing in client side...");
        const signedPsbt = await (window as any).unisat.signPsbt(
          result.payload,
          {
            autoFinalized: false,
            toSignInputs,
          }
        );
        console.log("signedPsbt ==> ", signedPsbt);

        Notiflix.Loading.change("Signing in server side...");
        const updateResult = await claimApproveBroadcastingController(
          slug,
          childIdList,
          signedPsbt
        );
        Notiflix.Loading.change("Finalizing approving request...");
        Notiflix.Loading.remove();

        if (updateResult.success) {
          Notiflix.Notify.success(updateResult.message);
          Notiflix.Notify.info(updateResult.payload);

          fetchClaimRequestList();
        } else {
          Notiflix.Notify.failure(updateResult.message);
        }

        console.log("updateResult ==> ", updateResult);
      } else {
        Notiflix.Loading.remove();
        Notiflix.Notify.failure(result.message);
      }
    } catch (error) {
      Notiflix.Loading.remove();
    }
  };

  useEffect(() => {
    console.log("paymentAddress ==> ", paymentAddress);
    if(paymentAddress) fetchClaimRequestList();
  }, [paymentAddress]);
  return (
    <div className="px-10 pt-6 flex flex-col text-center">
      <p className="text-white text-[30px] mt-10">Admin Page</p>
      {paymentAddress ? (
        <div className="flex flex-col mt-6 border p-4">
          {claimRequestList ? (
            <div className="flex flex-col gap-2 w-full border-[#28292C]">
              <div className="flex flex-row text-white pb-4 border-b-1">
                <div className="flex flex-row gap-2 text-white justify-around w-full">
                  <p className="w-1/12">No</p>
                  <p className="w-1/6">Child Id</p>
                  <p className="w-1/6">Reward Address</p>
                  <p className="w-1/12">Reward Amount</p>
                  <p className="w-1/6">Request Address</p>
                  <p className="w-1/6">Request Date</p>
                </div>
              </div>
              <div className="flex flex-col pb-4 border-b">
                {claimRequestList?.map((list: IClaimRequest, index: number) => (
                  <div className="flex flex-row gap-2 text-white justify-around mt-2" key={"claimRequestList"+index}>
                    <p className="w-1/12">{index + 1}</p>
                    <p className="w-1/6 truncate">{list.childId}</p>
                    <p className="w-1/6 truncate">{list.rewardAddress}</p>
                    <p className="w-1/12 truncate">{list.rewardAmount}</p>
                    <p className="w-1/6 truncate">{list.requestAddress}</p>
                    <p className="w-1/6 truncate">
                      {list.createdAt.replaceAll("T", " ")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col mx-auto mt-6">
                <p className="text-[24px] text-white py-4">Admin Vault Balance</p>
                <p className="text-white">
                  BTC Balance: {btcBalance / Math.pow(10, 8)} BTC
                </p>
                <p className="text-white">
                  Rune Balance: {rewardRuneData?.amount}{" "}
                  {rewardRuneData?.symbol}
                </p>
              </div>
            </div>
          ) : (
            <></>
          )}
          {/* Submit */}
          <Button
            color="warning"
            variant="flat"
            onPress={onApproveClaimRequest}
            className="capitalize mt-6 w-40 mx-auto"
          >
            Approve Request
          </Button>
        </div>
      ) : (
        <div className="mt-6 text-white">Connect wallet first please...</div>
      )}
    </div>
  );
}
