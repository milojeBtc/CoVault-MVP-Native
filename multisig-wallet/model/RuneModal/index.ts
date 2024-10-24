import mongoose from "mongoose";

const RuneSchema = new mongoose.Schema({
    txId: { type: String },
    sendBTCTxId: { type: String, required: true, unique: true },
    runeName: { type: String, required: true},
    runeSymbol: { type: String, required: true},
    initialPrice: { type: String, required: true},
    creatorAddress: { type: String, required: true},
    runeid: { type: String },
    runeAmount: { type: String, required: true},
    remainAmount: { type: String, required: true},
    psbt: { type: String, required: true},
    status: { type: String, required: true},
});

const RuneModel = mongoose.model("rune", RuneSchema);

export default RuneModel;
