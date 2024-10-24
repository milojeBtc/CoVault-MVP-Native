"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultType = exports.Status = void 0;
var Status;
(function (Status) {
    Status["Pending"] = "Pending";
    Status["Ready"] = "Ready";
    Status["End"] = "End";
})(Status || (exports.Status = Status = {}));
var VaultType;
(function (VaultType) {
    VaultType["NativeSegwit"] = "NativeSegwit";
    VaultType["Taproot"] = "Taproot";
})(VaultType || (exports.VaultType = VaultType = {}));
