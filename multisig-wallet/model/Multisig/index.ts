import mongoose from "mongoose";

const Multisig = new mongoose.Schema({
  cosigner: [
    { type: String, required: true }
  ],
  witnessScript: { type: String, required: true },
  p2msOutput: { type: String, required: true },
  address: { type: String, required: true },
  threshold: {type: Number, required: true},
  assets: {
    runeName: { type: String, required: true },
    runeAmount: { type: String, required: true },
    initialPrice: { type: String, required: true },
    runeSymbol: { type: String, required: true },
    creatorAddress: { type: String, required: true }
  },
  imageUrl: { type: String },
  createdAt: { type: Date, default: new Date() }
});

const MultisigModal = mongoose.model("multisig", Multisig);

export default MultisigModal;