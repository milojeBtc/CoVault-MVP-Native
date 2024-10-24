import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  musigId: { type: String, required: true },
  type: { type: String, required: true },
  transferAmount: { type: String },
  destinationAddress: { type: String, required: true },
  creator: { type: String, required: true },
  cosigner: [{ type: String, required: true }],
  signedCosigner: [{ type: String, required: true }],
  psbt: [{ type: String, required: true }],
  threshold: { type: Number, required: true },
  assets: {
    runeName: { type: String, required: true },
    runeAmount: { type: String, required: true },
    initialPrice: { type: String, required: true },
    runeSymbol: { type: String, required: true },
    creatorAddress: { type: String, required: true },
  },
  pending: { type: String },
  createdAt: { type: Date, default: new Date() },
});

const RequestModal = mongoose.model("RequestModal", RequestSchema);

export default RequestModal;
