import mongoose from "mongoose";

const TempTaprootMultisig = new mongoose.Schema({
  cosigner: [
    { type: String, required: true }
  ],
  threshold: {type: Number, required: true},
  privateKey: {type: String, required: true},
  tapscript: {type: String, required: true},
  address: { type: String, required: true },
  assets: {
    runeName: { type: String, required: true },
    runeAmount: { type: String, required: true },
    initialPrice: { type: String, required: true },
    runeSymbol: { type: String, required: true },
    creatorAddress: { type: String, required: true }
  },
  imageUrl: { type: String },
  createdAt: { type: Date, default: new Date() },
});

const TempTaprootMultisigModal = mongoose.model("TempTaprootmultisig", TempTaprootMultisig);

export default TempTaprootMultisigModal;