"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaprootMultisigWallet = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("tiny-secp256k1"));
const bip341_1 = require("bitcoinjs-lib/src/payments/bip341");
function makeUnspendableInternalKey(provableNonce) {
    // This is the generator point of secp256k1. Private key is known (equal to 1)
    const G = Buffer.from("0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8", "hex");
    // This is the hash of the uncompressed generator point.
    // It is also a valid X value on the curve, but we don't know what the private key is.
    // Since we know this X value (a fake "public key") is made from a hash of a well known value,
    // We can prove that the internalKey is unspendable.
    const Hx = bitcoin.crypto.sha256(G);
    if (provableNonce) {
        if (provableNonce.length !== 32) {
            throw new Error("provableNonce must be a 32 byte random value shared between script holders");
        }
        // Using a shared random value, we create an unspendable internalKey
        // P = H + int(hash_taptweak(provableNonce))*G
        // Since we don't know H's private key (see explanation above), we can't know P's private key
        const tapHash = bitcoin.crypto.taggedHash("TapTweak", provableNonce);
        const ret = ecc.xOnlyPointAddTweak(new Uint8Array(Hx), new Uint8Array(tapHash));
        if (!ret) {
            throw new Error("provableNonce produced an invalid key when tweaking the G hash");
        }
        return Buffer.from(ret.xOnlyPubkey);
    }
    else {
        // The downside to using no shared provable nonce is that anyone viewing a spend
        // on the blockchain can KNOW that you CAN'T use key spend.
        // Most people would be ok with this being public, but some wallets (exchanges etc)
        // might not want ANY details about how their wallet works public.
        return Hx;
    }
}
class TaprootMultisigWallet {
    constructor(
    /**
     * A list of all the (x-only) pubkeys in the multisig
     */
    pubkeys, 
    /**
     * The number of required signatures
     */
    requiredSigs, 
    /**
     * The private key you hold.
     */
    privateKey, 
    /**
     * leaf version (0xc0 currently)
     */
    leafVersion, 
    /**
     * Optional shared nonce. This should be used in wallets where
     * the fact that key-spend is unspendable should not be public,
     * BUT each signer must verify that it is unspendable to be safe.
     */
    sharedNonce) {
        this.pubkeys = pubkeys;
        this.requiredSigs = requiredSigs;
        this.privateKey = privateKey;
        this.leafVersion = leafVersion;
        this.sharedNonce = sharedNonce;
        this.leafScriptCache = null;
        this.internalPubkeyCache = null;
        this.paymentCache = null;
        this.network = bitcoin.networks.bitcoin;
        const pubkey = ecc.pointFromScalar(new Uint8Array(privateKey));
        if (!pubkey)
            throw "Invalid Keys";
        this.publicKeyCache = Buffer.from(pubkey);
        // IMPORTANT: Make sure the pubkeys are sorted (To prevent ordering issues between wallet signers)
        this.pubkeys.sort((a, b) => a.compare(new Uint8Array(b)));
    }
    setNetwork(network) {
        this.network = network;
        return this;
    }
    // Required for Signer interface.
    // Prevent setting by using a getter.
    get publicKey() {
        return this.publicKeyCache;
    }
    /**
     * Lazily build the leafScript. A 2 of 3 would look like:
     * key1 OP_CHECKSIG key2 OP_CHECKSIGADD key3 OP_CHECKSIGADD OP_2 OP_GREATERTHANOREQUAL
     */
    get leafScript() {
        if (this.leafScriptCache) {
            return this.leafScriptCache;
        }
        const ops = [];
        this.pubkeys.forEach((pubkey) => {
            if (ops.length === 0) {
                ops.push(pubkey);
                ops.push(bitcoin.opcodes.OP_CHECKSIG);
            }
            else {
                ops.push(pubkey);
                ops.push(bitcoin.opcodes.OP_CHECKSIGADD);
            }
        });
        if (this.requiredSigs > 16) {
            ops.push(bitcoin.script.number.encode(this.requiredSigs));
        }
        else {
            ops.push(bitcoin.opcodes.OP_1 - 1 + this.requiredSigs);
        }
        ops.push(bitcoin.opcodes.OP_GREATERTHANOREQUAL);
        this.leafScriptCache = bitcoin.script.compile(ops);
        return this.leafScriptCache;
    }
    get internalPubkey() {
        if (this.internalPubkeyCache) {
            return this.internalPubkeyCache;
        }
        // See the helper function for explanation
        this.internalPubkeyCache = makeUnspendableInternalKey(this.sharedNonce);
        return this.internalPubkeyCache;
    }
    get scriptTree() {
        // If more complicated, maybe it should be cached.
        // (ie. if other scripts are created only to create the tree
        // and will only be stored in the tree.)
        return {
            output: this.leafScript,
        };
    }
    get redeem() {
        return {
            output: this.leafScript,
            redeemVersion: this.leafVersion,
        };
    }
    get payment() {
        if (this.paymentCache) {
            return this.paymentCache;
        }
        this.paymentCache = bitcoin.payments.p2tr({
            internalPubkey: this.internalPubkey,
            scriptTree: this.scriptTree,
            redeem: this.redeem,
            network: this.network,
        });
        return this.paymentCache;
    }
    get output() {
        return this.payment.output;
    }
    get address() {
        return this.payment.address;
    }
    get controlBlock() {
        const witness = this.payment.witness;
        return witness[witness.length - 1];
    }
    verifyInputScript(psbt, index) {
        if (index >= psbt.data.inputs.length)
            throw new Error("Invalid input index");
        const input = psbt.data.inputs[index];
        if (!input.tapLeafScript)
            throw new Error("Input has no tapLeafScripts");
        const hasMatch = input.tapLeafScript.length === 1 &&
            input.tapLeafScript[0].leafVersion === this.leafVersion &&
            input.tapLeafScript[0].script.equals(new Uint8Array(this.leafScript)) &&
            input.tapLeafScript[0].controlBlock.equals(new Uint8Array(this.controlBlock));
        if (!hasMatch)
            throw new Error("No matching leafScript, or extra leaf script. Refusing to sign.");
    }
    addInput(psbt, hash, index, value) {
        psbt.addInput({
            hash,
            index,
            witnessUtxo: { value, script: this.output },
        });
        psbt.updateInput(psbt.inputCount - 1, {
            tapLeafScript: [
                {
                    leafVersion: this.leafVersion,
                    script: this.leafScript,
                    controlBlock: this.controlBlock,
                },
            ],
        });
    }
    addDummySigs(psbt) {
        const leafHash = (0, bip341_1.tapleafHash)({
            output: this.leafScript,
            version: this.leafVersion,
        });
        for (const input of psbt.data.inputs) {
            if (!input.tapScriptSig)
                continue;
            const signedPubkeys = input.tapScriptSig
                .filter((ts) => ts.leafHash.equals(new Uint8Array(leafHash)))
                .map((ts) => ts.pubkey);
            for (const pubkey of this.pubkeys) {
                if (signedPubkeys.some((sPub) => sPub.equals(new Uint8Array(pubkey))))
                    continue;
                // Before finalizing, every key that did not sign must have an empty signature
                // in place where their signature would be.
                // In order to do this currently we need to construct a dummy signature manually.
                input.tapScriptSig.push({
                    // This can be reused for each dummy signature
                    leafHash,
                    // This is the pubkey that didn't sign
                    pubkey,
                    // This must be an empty Buffer.
                    signature: Buffer.from([]),
                });
            }
        }
    }
    // required for Signer interface
    sign(hash, _lowR) {
        return Buffer.from(ecc.sign(new Uint8Array(hash), new Uint8Array(this.privateKey)));
    }
    // required for Signer interface
    signSchnorr(hash) {
        return Buffer.from(ecc.signSchnorr(new Uint8Array(hash), new Uint8Array(this.privateKey)));
    }
}
exports.TaprootMultisigWallet = TaprootMultisigWallet;
