"use client";

import Notiflix from "notiflix";
import { useClipboard } from "use-clipboard-copy";

export const OnCopyClipboard = (str: string | undefined) => {
    Notiflix.Notify.success("Copied to clipboard.");
  const clipboard = useClipboard();
  if (!str) return;
  clipboard.copy(str);
};