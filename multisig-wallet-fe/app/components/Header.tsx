"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";

import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  signMessage,
} from "sats-connect";

import Notiflix from "notiflix";
import WalletConnectIcon from "./Icon/WalletConnectIcon";
import WalletContext from "../contexts/WalletContext";
import { WalletTypes, Account, SIGN_MESSAGE, TEST_MODE } from "../utils/utils";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import type { Wallet, WalletWithFeatures } from "@wallet-standard/base";
import { useWallets } from "@wallet-standard/react";
import { ConnectionStatusContext } from "../contexts/ConnectContext";
import { walletConnect } from "../controller";

// Icon
import { IoPieChart } from "react-icons/io5";
import { FiPlusCircle } from "react-icons/fi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { RiShoppingBasketFill } from "react-icons/ri";

import { Loading } from "./Loading";

const SatsConnectNamespace = "sats-connect:";

function isSatsConnectCompatibleWallet(wallet: Wallet) {
  return SatsConnectNamespace in wallet.features;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [open, setOpen] = useState(false);
  const { wallets } = useWallets();
  const [hash, setHash] = useState("");

  const connectionStatus = useContext(ConnectionStatusContext);

  const [wallet, setWallet] = useState<any | null>(null);
  const [triggerFetch, setTriggerFetch] = useState(0);

  // Loading
  const [loading, setLoading] = useState(false);
  // End

  const {
    pageIndex,
    ordinalAddress,
    paymentAddress,
    setPageIndex,
    setWalletType,
    setOrdinalAddress,
    setPaymentAddress,
    setPaymentPublicKey,
    setOrdinalPublicKey,
  } = useContext(WalletContext);

  const unisatConnectWallet = async () => {
    try {
      const currentWindow: any = window;
      if (typeof currentWindow?.unisat !== "undefined") {
        const unisat: any = currentWindow?.unisat;
        try {
          const network = await unisat.getNetwork();
          if (network != (TEST_MODE ? "testnet" : "livenet")) {
            await unisat.switchNetwork(TEST_MODE ? "testnet" : "livenet");
          }

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
        } catch (e) {
          Notiflix.Notify.failure("Connect failed!");
        }
      }
    } catch (error) {
      console.log("unisatConnectWallet error ==> ", error);
    }
  };

  const xverseConnectWallet = async () => {
    try {
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

  const meconnect = () => {
    try {
      const compatibleWallet = wallets.find(isSatsConnectCompatibleWallet);
      if (compatibleWallet) {
        setWallet(compatibleWallet);
        setTriggerFetch((prev) => prev + 1);
      } else {
        console.error("No compatible wallet found.");
        toast.error("No compatible wallet found.");
      }
    } catch (error) {
      console.log("meconnect error ==> ", error);
    }
  };

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

    setOrdinalAddress("");
    setPaymentAddress("");
    setOrdinalPublicKey("");
    setPaymentPublicKey("");
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

  const openWalletModal = () => {
    if (paymentAddress) {
      removeLocalStorage();
      Notiflix.Notify.success("Wallet disconnected!");
      return;
    }
    onOpen();
  };

  const updatePageIndex = (index: number, route: string) => {
    console.log("pageIndex ==> ", index);
    router.push(route);
    setPageIndex(index);
  };

  useEffect(() => {
    Notiflix.Notify.init({
      position: "right-bottom",
    });
    recoverWalletConnection();
  }, []);

  useEffect(() => {
    if (wallet && triggerFetch) {
      console.log("Wallet has been set, now doing something with it...");
      // Perform actions that depend on the wallet being set
      try {
        getAddress({
          getProvider: async () =>
            (wallet as unknown as WalletWithFeatures<any>).features[
              SatsConnectNamespace
            ]?.provider,
          payload: {
            purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
            message: "Address for receiving Ordinals and payments",
            network: {
              type: BitcoinNetworkType.Mainnet,
            },
          },
          onFinish: async (response) => {
            connectionStatus?.setAccounts(
              response.addresses as unknown as Account[]
            );

            let tempWalletType = WalletTypes.MAGICEDEN;
            let tempOrdinalAddress = response.addresses[0].address as string;
            let tempPaymentAddress = response.addresses[1].address as string;
            let tempOrdinalPublicKey = response.addresses[0]
              .publicKey as string;
            let tempPaymentPublicKey = response.addresses[1]
              .publicKey as string;

            let res = "";

            await signMessage({
              getProvider: async () =>
                (wallet as unknown as WalletWithFeatures<any>).features[
                  SatsConnectNamespace
                ]?.provider,
              payload: {
                network: {
                  type: BitcoinNetworkType.Mainnet,
                },
                address: tempPaymentAddress!,
                message: "Welcome to Co-vault",
              },
              onFinish: (response) => {
                res = response;
              },
              onCancel: () => {
                alert("Request canceled");
              },
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
              Notiflix.Notify.success("Connect success with ME!");
              setOrdinalAddress(response.addresses[0].address);
              setOrdinalPublicKey(response.addresses[0].publicKey);
              setPaymentAddress(response.addresses[1].address);
              setPaymentPublicKey(response.addresses[1].publicKey);
              setWalletType(WalletTypes.MAGICEDEN);
              onClose();
            } else {
              Notiflix.Notify.info("Not match hash");
            }
          },
          onCancel: () => {
            toast.error("You cancelled the operation");
          },
        });
      } catch (err) {
        console.error("Error while trying to use wallet:", err);
        Notiflix.Notify.success("Connect failure!");
      }
    }
  }, [wallet, triggerFetch]);

  useEffect(() => {
    if (ordinalAddress) {
      onClose();
    }
  }, [ordinalAddress]);

  return (
    <div className="flex gap-3 bg-[#1C1D1F]">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="full"
        className="bg-[#1C1D1F] p-3"
      >
        <NavbarContent justify="start" className="ml-10 gap-4">
          <NavbarItem
            className="cursor-pointer"
            onClick={() => updatePageIndex(0, "/pages/multisig")}
          >
            <img className="" src="/header-logo.png"></img>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="center" className="gap-4">
          <NavbarItem
            className="cursor-pointer"
            onClick={() => updatePageIndex(0, "/pages/multisig")}
          >
            {pageIndex == 0 ? (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 bg-[#28292C] rounded-2xl">
                <IoPieChart size={18} />
                <p className="">Multisig vault</p>
              </div>
            ) : (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 hover:bg-[#20292C] rounded-2xl">
                <IoPieChart size={18} />
                <p className="">Multisig vault</p>
              </div>
            )}
          </NavbarItem>
          <NavbarItem
            className="cursor-pointer"
            onClick={() => updatePageIndex(1, "/pages/createNewWallet")}
          >
            {pageIndex == 1 ? (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 bg-[#20292C] rounded-2xl">
                <FiPlusCircle size={18} />
                <p className="">New Vault</p>
              </div>
            ) : (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 hover:bg-[#20292C] rounded-2xl">
                <FiPlusCircle size={18} />
                <p className="">New Vault</p>
              </div>
            )}
          </NavbarItem>

          {/* page Index 2 used for update vault */}
          <NavbarItem
            className="cursor-pointer"
            onClick={() => updatePageIndex(3, "/pages/request")}
          >
            {pageIndex == 3 ? (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 bg-[#20292C] rounded-2xl">
                <IoDocumentTextOutline size={18} />
                <p className="">Request</p>
              </div>
            ) : (
              <div className="flex flex-row px-4 py-2 text-white items-center justify-between gap-4 hover:bg-[#20292C] rounded-2xl">
                <IoDocumentTextOutline size={18} />
                <p className="">Request</p>
              </div>
            )}
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end" className="gap-10">
          <NavbarItem>
            <Button
              color="warning"
              variant="flat"
              onPress={() => openWalletModal()}
              className="capitalize"
            >
              <WalletConnectIcon />
              {paymentAddress ? (
                <p className="truncate w-28">{paymentAddress}</p>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
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
                Connect Wallet
              </ModalHeader>
              <ModalBody>
                <div className="p-2 pb-10">
                  <div className="flex flex-col gap-5 justify-center items-center">
                    <Button
                      onClick={() => unisatConnectWallet()}
                      color="primary"
                      variant="bordered"
                      className="w-[200px]"
                    >
                      Unisat Wallet Connect
                    </Button>
                    <Button
                      onClick={() => xverseConnectWallet()}
                      color="secondary"
                      variant="bordered"
                      className="w-[200px]"
                    >
                      XVerse Wallet Connect
                    </Button>
                    <Button
                      onClick={() => meconnect()}
                      color="danger"
                      variant="bordered"
                      className="w-[200px]"
                    >
                      ME Wallet Connect
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {loading ? <Loading /> : <></>}
    </div>
  );
};

export default Header;
