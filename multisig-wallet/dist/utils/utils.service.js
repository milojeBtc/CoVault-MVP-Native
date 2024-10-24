"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.toXOnly2 = exports.toXOnly = exports.chooseWinner = void 0;
const chooseWinner = (array) => __awaiter(void 0, void 0, void 0, function* () {
    const item = array[Math.floor(Math.random() * array.length)];
    return item;
});
exports.chooseWinner = chooseWinner;
const toXOnly = (pubKey) => pubKey.length == 32 ? pubKey : pubKey.slice(1, 33);
exports.toXOnly = toXOnly;
const toXOnly2 = (pubkey) => {
    return pubkey.subarray(1, 33);
};
exports.toXOnly2 = toXOnly2;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
