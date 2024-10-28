"use client";

import Notiflix from "notiflix";
import { useClipboard } from "use-clipboard-copy";

export const OnCopyClipboard = (str: string | undefined) => {
  Notiflix.Notify.success("Copied to clipboard.");
  const clipboard = useClipboard();
  if (!str) return;
  clipboard.copy(str);
};

export const HexToBase64Convertor = (hex: string) => {
  // Ensure the hex string has an even length
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length");
  }

  // Convert hex to byte array
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  // Convert byte array to Base64
  // @ts-ignore
  const binaryString = String.fromCharCode(...byteArray);
  const base64String = btoa(binaryString);

  return base64String;
};

export const base64ToHex = (base64: string) => {
  // Decode Base64 to a byte array
  const binaryString = atob(base64);
  const byteArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
  }

  // Convert byte array to hex string
  let hexString = '';
  for (let i = 0; i < byteArray.length; i++) {
      // Convert each byte to hex and pad with leading zero if necessary
      const hex = byteArray[i].toString(16).padStart(2, '0');
      hexString += hex;
  }

  return hexString;
}

