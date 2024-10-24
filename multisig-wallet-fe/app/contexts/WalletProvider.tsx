import React, { ReactNode, useState } from "react";
import WalletContext from "./WalletContext";

const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletType, setWalletType] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentPublicKey, setPaymentPublicKey] = useState("");
  const [ordinalAddress, setOrdinalAddress] = useState("");
  const [ordinalPublicKey, setOrdinalPublicKey] = useState("")
  const [pageIndex, setPageIndex] = useState(-1);

  const logout = () => {
    setPaymentAddress("");
    setWalletType("");
    setPaymentPublicKey("");
    setOrdinalAddress("");
    setOrdinalPublicKey("");
  };

  return (
    <WalletContext.Provider
      value={{
        pageIndex,
        walletType,
        paymentPublicKey,
        paymentAddress,
        ordinalAddress,
        ordinalPublicKey,
        unisat: {},
        logout,
        setPageIndex,
        setWalletType,
        setPaymentAddress,
        setPaymentPublicKey,
        setOrdinalAddress,
        setOrdinalPublicKey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
