import mongoose from "mongoose";

const PendingMultisig = new mongoose.Schema({
  vaultName: { type: String, required: true },
  addressList: [{ type: String, required: true }],
  pubkeyList: [{ type: String }],
  threshold: { type: Number, required: true },
  vaultType: { type: String, required: true },
  assets: {
    runeName: { type: String, required: true },
    runeAmount: { type: String, required: true },
    initialPrice: { type: String, required: true },
    runeSymbol: { type: String, required: true },
    creatorAddress: { type: String, required: true },
  },
  imageUrl: { type: String, required: true },
  creator: {
    walletName: { type: String, required: true },
    ordinalsAddress: { type: String, required: true },
    ordinalsPubkey: { type: String, required: true },
    paymentAddress: { type: String, required: true },
    paymentPubkey: { type: String, required: true },
  },
  createdAt: { type: Date, default: new Date() },
  pending: { type: Boolean, default: true }
});

const PendingMultisigModal = mongoose.model("pendingMultisig", PendingMultisig);

export default PendingMultisigModal;
