"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codec_1 = require("@polkadot/types/codec");
const types_1 = require("@polkadot/types");
const index_1 = require("./index");
class MemberId extends types_1.u64 {
}
exports.MemberId = MemberId;
class PaidTermId extends types_1.u64 {
}
exports.PaidTermId = PaidTermId;
class SubscriptionId extends types_1.u64 {
}
exports.SubscriptionId = SubscriptionId;
class Paid extends PaidTermId {
}
exports.Paid = Paid;
class Screening extends types_1.AccountId {
}
exports.Screening = Screening;
class EntryMethod extends codec_1.EnumType {
    constructor(value, index) {
        super({
            Paid,
            Screening
        }, value, index);
    }
}
exports.EntryMethod = EntryMethod;
class UserInfo extends codec_1.Struct {
    constructor(value) {
        super({
            handle: index_1.OptionText,
            avatar_uri: index_1.OptionText,
            about: index_1.OptionText
        }, value);
    }
}
exports.UserInfo = UserInfo;
class PaidMembershipTerms extends codec_1.Struct {
    constructor(value) {
        super({
            id: PaidTermId,
            fee: types_1.BalanceOf,
            text: types_1.Text
        }, value);
    }
    get id() {
        return this.get('id');
    }
    get fee() {
        return this.get('fee');
    }
    get text() {
        return this.get('text');
    }
}
exports.PaidMembershipTerms = PaidMembershipTerms;
function registerMembershipTypes() {
    try {
        const typeRegistry = types_1.getTypeRegistry();
        // Register enum EntryMethod and its options:
        typeRegistry.register({
            Paid,
            Screening,
            EntryMethod
        });
        typeRegistry.register({
            MemberId,
            PaidTermId,
            SubscriptionId,
            Profile: {
                id: 'MemberId',
                handle: 'Text',
                avatar_uri: 'Text',
                about: 'Text',
                registered_at_block: 'BlockNumber',
                registered_at_time: 'Moment',
                entry: 'EntryMethod',
                suspended: 'Bool',
                subscription: 'Option<SubscriptionId>'
            },
            UserInfo,
            CheckedUserInfo: {
                handle: 'Text',
                avatar_uri: 'Text',
                about: 'Text'
            },
            PaidMembershipTerms: {
                id: 'PaidTermId',
                fee: 'BalanceOf',
                text: 'Text'
            }
        });
    }
    catch (err) {
        console.error('Failed to register custom types of membership module', err);
    }
}
exports.registerMembershipTypes = registerMembershipTypes;
