"use client";

import {
  claimController,
  createParentStakingVaultController,
  fetchParentListController,
  fetchUserBalanceController,
  stakingBroadcastingController,
  stakingController,
} from "@/app/controller";
import { IClaimRequest, IErr, IErr2, IParentList } from "@/app/utils/_type";
import React, { useContext, useEffect, useRef, useState } from "react";

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
import { AiOutlineUpload } from "react-icons/ai";
import WalletContext from "@/app/contexts/WalletContext";
import Notiflix from "notiflix";
import validate, { Network } from "bitcoin-address-validation";
import { TEST_MODE } from "@/app/utils/utils";

import { useRouter } from "next/navigation";

export default function Staking() {
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
  // UseState
  const [parentList, setParentList] = useState<IParentList[]>();
  const [err, setErr] = useState<IErr2>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalFlag, setModalFlag] = useState("Create");

  const [selectedVault, setSelectedVault] = useState<IParentList>();
  const [claimRequestList, setClaimRequestList] = useState<IClaimRequest[]>();

  const [balance, setBalance] = useState(0);
  // End

  const router = useRouter();

  // Ref
  const stakableRuneIdRef = useRef(null);
  const rewardRateRef = useRef(null);
  const rewardRuneIdRef = useRef(null);
  const claimableMinTime = useRef(null);
  const stakingAmountRef = useRef(null);
  const rewardAddressRef = useRef(null);
  // End Ref

  // Image Upload
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
  // End

  // Open creation Modal
  const openCreationModal = () => {
    setModalFlag("Create");
    setAvatar({
      preview: "",
    });
    onOpen();
  };
  // End

  // Open Staking Modal
  const openStakingModal = async (vault: IParentList) => {
    setModalFlag("Staking");
    setSelectedVault(vault);
    await fetchUserBalance(vault);
    setAvatar({
      preview: "",
    });
    onOpen();
  };

  const openClaimModal = async (vault: IParentList) => {
    setModalFlag("Claim");
    setSelectedVault(vault);
    onOpen();
  };

  const openAdminPanelModal = async (vault: IParentList) => {
    // setSelectedVault(vault);
    router.push("/pages/staking/" + vault.id);
    // Notiflix.Loading.hourglass("Fetching Claim Request List...");
    // const result = await fetchClaimRequestList(vault.id);
    // if (result.success) {
    //   Notiflix.Loading.remove();
    //   Notiflix.Notify.success("Fetching Claim Request Successfully.");
    //   setClaimRequestList(result.payload);
        
    // } else {
    //   Notiflix.Loading.remove();
    //   Notiflix.Notify.failure(result.message);
    // }
  };
  // End

  const onChangeHandler = () => {
    setErr({
      stakableRuneIdErr: "",
      rewardRateRefErr: "",
      rewardRuneIdErr: "",
      claimableMinTimeErr: "",
    });
  };

  const onCreateVault = async () => {
    const assets = {
      stakableRuneId: "",
      rewardRate: "",
      rewardRuneId: "",
      claimableMinTime: "",
      creatorAddress: ordinalAddress,
    };

    if (!fileInput?.current?.files?.[0]!) {
      Notiflix.Notify.failure("The banner image is required.");
      return;
    }

    if (stakableRuneIdRef.current)
      assets.stakableRuneId = stakableRuneIdRef.current["value"];
    if (rewardRateRef.current)
      assets.rewardRate = rewardRateRef.current["value"];
    if (rewardRuneIdRef.current)
      assets.rewardRuneId = rewardRuneIdRef.current["value"];
    if (claimableMinTime.current)
      assets.claimableMinTime = claimableMinTime.current["value"];

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

    const createResult = await createParentStakingVaultController(
      assets.claimableMinTime,
      assets.rewardRate,
      assets.rewardRuneId,
      assets.stakableRuneId,
      imageUrl,
      paymentAddress,
      paymentPublicKey,
      ordinalAddress,
      ordinalPublicKey
    );

    console.log("createResult ==> ", createResult);
    if (createResult.success) {
      Notiflix.Notify.success("Staking Vault created successfully.");
      fetchParentList();
    } else {
      Notiflix.Notify.failure(createResult.message);
    }
  };

  const onStakingFunc = async () => {
    console.log("onStakingFunc is called ==============> ");
    if (!balance) {
      Notiflix.Notify.failure("You have no any rune for staking.");
      return;
    }
    let stakingAmount = 0;
    if (stakingAmountRef.current)
      stakingAmount = stakingAmountRef.current["value"];
    if (!stakingAmount) {
      Notiflix.Notify.failure("You need to enter amount number.");
      return;
    }

    console.log("stakingAmount ==> ", stakingAmount);

    if (!balance) {
      Notiflix.Notify.failure("Staking Amount should bigger than 0.");
      return;
    }

    if (balance < stakingAmount * 1) {
      Notiflix.Notify.failure("Staking Amount should less than balance");
      return;
    }

    if (!selectedVault) {
      Notiflix.Notify.failure("There is no selected vault");
      return;
    }

    console.log("selectedVault ==> ", selectedVault);
    console.log(
      " ===> ",
      selectedVault.id,
      stakingAmount,
      paymentAddress,
      paymentPublicKey,
      ordinalAddress,
      ordinalPublicKey
    );
    const stakingResult = await stakingController(
      selectedVault.id,
      stakingAmount,
      paymentAddress,
      paymentPublicKey,
      ordinalAddress,
      ordinalPublicKey
    );
    console.log("stakingResult ==> ", stakingResult);

    if (!stakingResult.success) {
      Notiflix.Notify.failure(stakingResult.message);
      return;
    }
    const psbt = stakingResult.payload.psbt;
    const signedPsbt = await (window as any).unisat.signPsbt(psbt, {
      autoFinalized: false,
    });
    console.log("signed PSBT ==> ", signedPsbt);

    const txResult = await stakingBroadcastingController(
      signedPsbt,
      stakingResult.payload.id
    );

    if (!txResult.success) {
      Notiflix.Notify.failure(txResult.message);
      return;
    }

    Notiflix.Notify.success(txResult.message);
    Notiflix.Notify.success(txResult.payload);

    console.log("txResult ==> ", txResult);

    console.log("===== End =====");
    fetchParentList();
  };

  const onClaimFunc = async () => {
    let rewardAddress = "";
    if (rewardAddressRef.current)
      rewardAddress = rewardAddressRef.current["value"];
    if (!rewardAddress) {
      Notiflix.Notify.failure("You need to enter rewardAddress.");
      return;
    }

    if (
      !validate(rewardAddress, TEST_MODE ? Network.testnet : Network.mainnet)
    ) {
      Notiflix.Notify.failure("Your address is not valid.");
      return;
    }
    if (!selectedVault) {
      Notiflix.Notify.failure("You need to select one vault.");
      return;
    }
    const result = await claimController(
      selectedVault?.id,
      rewardAddress,
      paymentAddress,
      paymentPublicKey,
      ordinalAddress,
      ordinalPublicKey
    );
    if (result.success) {
      Notiflix.Notify.success(result.message);
      onClose();
    } else {
      Notiflix.Notify.failure(result.message);
      onClose();
    }
    console.log("result ==> ", result);
  };

  // Init
  useEffect(() => {
    console.log("payment Address is changed..  ===========>")
    if(paymentAddress) fetchParentList();
  }, [paymentAddress]);


  // End Init

  // Controller
  const fetchParentList = async () => {
    if (!ordinalAddress) {
      setParentList([]);
      return;
    }
    Notiflix.Loading.hourglass("Fetching Staking Vault...")
    const result = await fetchParentListController(
      ordinalAddress,
      ordinalPublicKey,
      paymentAddress,
      paymentPublicKey
    );
    Notiflix.Loading.remove()
    console.log("fetchParentList ==> ", result);
    setParentList(result);
  };

  const fetchUserBalance = async (vault: IParentList) => {
    if (!selectedVault) return;

    console.log("fetchUserBalanceController ==> ", selectedVault);
    const runeId = vault.stakableRuneId;
    const balanceResult = await fetchUserBalanceController(
      runeId,
      ordinalAddress
    );
    setBalance(balanceResult);
    console.log("balance Result ==> ", balanceResult);

    // return balanceResult
  };
  // End Controller

  return (
    <div className="flex flex-col p-5 gap-4">
      <div
        className="ml-auto w-32 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#1f1f1c] cursor-pointer hover:brightness-150 duration-300"
        onClick={() => openCreationModal()}
      >
        <div className="flex bg-[#2c2c28] justify-center items-center h-full rounded-lg py-2">
          <p className="text-white text-center align-middle">Create Vault</p>
        </div>
      </div>
      {/* <p className="text-white text-[32px]">Staking Vault</p> */}
      <div className="flex flex-wrap mx-4 items-start justify-between pt-4 gap-4 px-10">
        {parentList?.length ? (
          parentList.map((wallet: IParentList, index: number) => (
            <div
              className="flex flex-col gap-3 w-[450px] px-6 rounded-3xl border-2 border-[#2C2C2C] bg-[#1C1D1F] p-4 text-white"
              key={index + "taprootWalletList"}
            >
              <p className="text-center text-[24px] mb-4">
                Staking Vault {index}
              </p>
              <div className="flex flex-row justify-between items-center mt-3 pt-3 border-t-1 border-gray-500">
                <p className="text-white text-[20px]">Deployer :</p>
                <p className="text-white text-[20px] w-48 truncate">
                  {wallet.deployer}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Address :</p>
                <p className="text-white text-[20px] w-48 truncate">
                  {wallet.address}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Reward Rate :</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.rewardRate}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Claimable Min Time :</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.claimableMinTime}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Child Valid Count:</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.childList.length}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Request Count :</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.claimRequest.length}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center border-t-1 mt-3 pt-3 border-gray-500">
                <p className="text-white text-[20px]">Claimable Amount :</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.remainReward}
                </p>
              </div>

              <div className="flex flex-row justify-between items-center">
                <p className="text-white text-[20px]">Last Claim Time :</p>
                <p className="text-white text-[20px] w-48 truncate text-right">
                  {wallet.lastClaimedTime}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex flex-row justify-around pt-6 border-t-1 border-gray-500">
                {wallet.deployer == ordinalAddress ? (
                  <div
                    className="w-32 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#004ce4] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => openAdminPanelModal(wallet)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        Admin Panel
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-32 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#91b900] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => openStakingModal(wallet)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        Staking
                      </p>
                    </div>
                  </div>
                )}
                {wallet.remainReward ? (
                  <div
                    className="w-32 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#0eaa00] cursor-pointer hover:brightness-150 duration-300"
                    onClick={() => openClaimModal(wallet)}
                  >
                    <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                      <p className="text-white text-center align-middle">
                        Claim
                      </p>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
                <div
                  className="w-32 rounded-lg p-[2px] bg-gradient-to-b from-[#6B737D] to-[#d80000] cursor-pointer hover:brightness-150 duration-300"
                  // onClick={() => updateHandler(wallet)}
                >
                  <div className="flex bg-[#28292C] justify-center items-center h-full rounded-lg py-2">
                    <p className="text-white text-center align-middle">
                      Unstaking
                    </p>
                  </div>
                </div>
              </div>
              {/* End Action Button */}
            </div>
          ))
        ) : (
          <div className="text-white">There is no taproot vault here</div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && modalFlag == "Create"}
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
                Create Parent Staking Vault
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  {/* Upload Image */}
                  <div className="flex flex-col mx-auto gap-1">
                    {/* <p className="text-white text-center">Upload Image</p> */}
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
                  {/* Input */}
                  <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Stakable Rune ID
                      </label>
                      <input
                        name="RuneName"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="2587772:289"
                        ref={stakableRuneIdRef}
                        onChange={() => onChangeHandler()}
                      />
                      {err?.stakableRuneIdErr ? (
                        <p className="text-red-500">{err.stakableRuneIdErr}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Reward Rate
                      </label>
                      <input
                        name="rewardRate"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="10"
                        ref={rewardRateRef}
                        onChange={() => onChangeHandler()}
                      />
                      {err?.rewardRateRefErr ? (
                        <p className="text-red-500">{err.rewardRateRefErr}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Reward Rune ID
                      </label>
                      <input
                        name="RewardRuneId"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="5000"
                        ref={rewardRuneIdRef}
                        onChange={() => onChangeHandler()}
                      />
                      {err?.rewardRuneIdErr ? (
                        <p className="text-red-500">{err.rewardRuneIdErr}</p>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Claimable Min Time
                      </label>
                      <input
                        name="RuneSymbol"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="5000"
                        ref={claimableMinTime}
                        onChange={() => onChangeHandler()}
                      />
                      {err?.claimableMinTimeErr ? (
                        <p className="text-red-500">
                          {err.claimableMinTimeErr}
                        </p>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                  {/* Submit */}
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={onCreateVault}
                    className="capitalize mt-4"
                  >
                    Create Vault
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* End Creating Modal */}

      {/* Staking Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && modalFlag == "Staking"}
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
                Staking
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  {/* Input */}
                  <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Your Address:
                      </label>
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white truncate">
                        {ordinalAddress}
                      </label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Rune ID:
                      </label>
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        {selectedVault?.stakableRuneId}
                      </label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Amount:
                      </label>
                      <input
                        name="amount"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="5000"
                        ref={stakingAmountRef}
                        onChange={() => onChangeHandler()}
                      />
                      {err?.rewardRuneIdErr ? (
                        <p className="text-red-500">{err.rewardRuneIdErr}</p>
                      ) : (
                        <></>
                      )}
                      <p className="text-right">Your Balance is {balance}</p>
                    </div>
                  </div>
                  {/* Submit */}
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={onStakingFunc}
                    className="capitalize mt-4"
                  >
                    Staking
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* End Staking Modal */}

      {/* Claim Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && modalFlag == "Claim"}
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
                Staking
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  {/* Input */}
                  <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                    <div className="flex flex-col gap-1">
                      <label className="font-manrope text-[14px] font-normal leading-6 text-white">
                        Reward Address :
                      </label>
                      <input
                        name="rewardAddress"
                        className="bg-[#16171B] rounded-xl p-2 gap-2 placeholder:text-gray-600 text-white focus:outline-none border-2 border-[#28292C]"
                        placeholder="tb1pcngsk49thk8...22mujl99y6szqw2kv0f"
                        ref={rewardAddressRef}
                        onChange={() => onChangeHandler()}
                      />
                    </div>
                  </div>
                  {/* Submit */}
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={onClaimFunc}
                    className="capitalize mt-4"
                  >
                    Claim
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* End Claim Modal */}

      {/* AdminPanel Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen && modalFlag == "AdminPanel"}
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
          body: "py-6 w-[600px]",
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
                Admin Panel
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  {/* Input */}
                  <div className="flex flex-col gap-2 w-full pl-4 border-l-2 border-[#28292C]">
                    <div className="flex flex-row text-white gap-2">
                      <p className="">No</p>
                      <p className="">ParentId</p>
                      <p className="">ChildId</p>
                      <p className="">RewardAddress</p>
                      <p className="">RequestAddress</p>
                      <p className="">ClaimedDate</p>
                      <p className="">RewardAmount</p>
                    </div>
                    <div className="flex flex-col">
                      {claimRequestList?.map(
                        (list: IClaimRequest, index: number) => (
                          <div className="flex flex-row gap-2" key={"claimRequestList"+index}>{
                            // @ts-ignore
                            Object.keys(list).map((field: string) => <p key={"Object.keys"+index}>{list[field]}</p>)
                          }</div>
                        )
                      )}
                    </div>
                  </div>
                  {/* Submit */}
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={onClaimFunc}
                    className="capitalize mt-4"
                  >
                    Claim
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* End Claim Modal */}
    </div>
  );
}
