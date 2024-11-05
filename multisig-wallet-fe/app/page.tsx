"use client";

import { useContext, useEffect, useState } from "react";

import Notiflix from "notiflix";

import WalletContext from "./contexts/WalletContext";
import {
  SIGN_MESSAGE,
  TEST_MODE
} from "./utils/utils";
import { WalletTypes } from "./utils/_type";

import {
  useDisclosure,
} from "@nextui-org/react";

import {
  walletConnect,
} from "./controller";

import { SlWallet } from "react-icons/sl";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  signMessage,
} from "sats-connect";
import { useRouter } from "next/navigation";

export default function Page() {

  const {
    ordinalAddress,
    setWalletType,
    setOrdinalAddress,
    setPaymentAddress,
    setPaymentPublicKey,
    setOrdinalPublicKey,
  } = useContext(WalletContext);

  const router = useRouter();

  // Batch Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  // End

  // Connect Wallet
  const [modalOpen, setModalOpen] = useState(false);
  const onConnectWalletOpen = async () => {
    setModalOpen(true);
  };
  // End

  // Wallet Connection
  const storeLocalStorage = (
    walletType: string,
    ordinalsAddress: string,
    ordinalsPublickey: string,
    paymentAddress: string,
    paymentPublicKey: string
  ) => {
    localStorage.setItem("walletType", walletType);
    localStorage.setItem("ordinalsAddress", ordinalsAddress);
    localStorage.setItem("ordinalsPublickey", ordinalsPublickey);
    localStorage.setItem("paymentAddress", paymentAddress);
    localStorage.setItem("paymentPublicKey", paymentPublicKey);
  };
  // End

  const isConnected = Boolean(ordinalAddress);

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

            storeLocalStorage(WalletTypes.UNISAT, accounts[0], pubkey, accounts[0], pubkey);

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
            type: TEST_MODE ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet,
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
                type: TEST_MODE ? BitcoinNetworkType.Testnet : BitcoinNetworkType.Mainnet,
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
              WalletTypes.XVERSE,
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

  useEffect(() => {
    if(isConnected){
      router.push("/pages/multisig");
    }
  }, [isConnected])

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
      </div>
    </>
  );
}
