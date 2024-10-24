export const chooseWinner = async (array: Array<string>) => {
  const item = array[Math.floor(Math.random() * array.length)];
  return item;
};

export const toXOnly = (pubKey: string) =>
  pubKey.length == 32 ? pubKey : pubKey.slice(1, 33);

export const toXOnly2 = (pubkey: Buffer): Buffer => {
  return pubkey.subarray(1, 33);
};

export const delay = (ms: number) => new Promise( resolve => setTimeout(resolve, ms))