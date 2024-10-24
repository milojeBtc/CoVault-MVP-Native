import { createContext, useContext } from "react";

interface ContextType {
  pageIndex: number,
  walletType: string;
  paymentAddress: string;
  paymentPublicKey: string;
  ordinalAddress: string;
  ordinalPublicKey: string;
  unisat: any;
  logout: () => void;
  setPageIndex: (index: number) => void,
  setWalletType: (walletType: string) => void;
  setPaymentAddress: (address: string) => void;
  setPaymentPublicKey: (publicKey: string) => void;
  setOrdinalAddress: (address: string) => void;
  setOrdinalPublicKey: (publicKey: string) => void;
}

const initialValue: ContextType = {
  pageIndex: 0,
  walletType: "",
  paymentAddress: "",
  paymentPublicKey: "",
  ordinalAddress: "",
  ordinalPublicKey: "",
  unisat: {},
  logout: () => {},
  setPageIndex: (index) => {},
  setWalletType: (walletType) => {},
  setPaymentAddress: (address) => {},
  setPaymentPublicKey: (publicKey) => {},
  setOrdinalAddress: (address) => {},
  setOrdinalPublicKey: (publicKey) => {},
};

const WalletContext = createContext(initialValue);

export const useWallet = () => {
  return useContext(WalletContext);
};

export default WalletContext;
