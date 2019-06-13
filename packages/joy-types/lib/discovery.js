"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codec_1 = require("@polkadot/types/codec");
const types_1 = require("@polkadot/types");
class IPNSIdentity extends types_1.Text {
}
exports.IPNSIdentity = IPNSIdentity;
class Url extends types_1.Text {
}
exports.Url = Url;
class AccountInfo extends codec_1.Struct {
    constructor(value) {
        super({
            identity: IPNSIdentity,
            expires_at: types_1.BlockNumber
        }, value);
    }
    get identity() {
        return this.get('identity');
    }
    get expires_at() {
        return this.get('expires_at');
    }
}
exports.AccountInfo = AccountInfo;
function registerDiscoveryTypes() {
    try {
        const typeRegistry = types_1.getTypeRegistry();
        typeRegistry.register({
            Url,
            IPNSIdentity,
            AccountInfo
        });
    }
    catch (err) {
        console.error('Failed to register custom types of discovery module', err);
    }
}
exports.registerDiscoveryTypes = registerDiscoveryTypes;
