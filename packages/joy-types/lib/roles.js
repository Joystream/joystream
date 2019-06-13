"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codec_1 = require("@polkadot/types/codec");
const types_1 = require("@polkadot/types");
const members_1 = require("./members");
class Role extends codec_1.Enum {
    constructor(value) {
        super([
            'Storage'
        ], value);
    }
}
exports.Role = Role;
class Actor extends codec_1.Struct {
    constructor(value) {
        super({
            member_id: members_1.MemberId,
            role: Role,
            account: types_1.AccountId,
            joined_at: types_1.BlockNumber
        }, value);
    }
    get member_id() {
        return this.get('member_id');
    }
    get role() {
        return this.get('role');
    }
    get account() {
        return this.get('account');
    }
    get joined_at() {
        return this.get('joined_at');
    }
}
exports.Actor = Actor;
class RoleParameters extends codec_1.Struct {
    constructor(value) {
        super({
            min_stake: types_1.Balance,
            min_actors: types_1.u32,
            max_actors: types_1.u32,
            reward: types_1.Balance,
            reward_period: types_1.BlockNumber,
            bonding_period: types_1.BlockNumber,
            unbonding_period: types_1.BlockNumber,
            min_service_period: types_1.BlockNumber,
            startup_grace_period: types_1.BlockNumber,
            entry_request_fee: types_1.Balance
        }, value);
    }
    get min_stake() {
        return this.get('min_stake');
    }
    get max_actors() {
        return this.get('max_actors');
    }
    get min_actors() {
        return this.get('min_actors');
    }
    get reward() {
        return this.get('reward');
    }
    get reward_period() {
        return this.get('reward_period');
    }
    get unbonding_period() {
        return this.get('unbonding_period');
    }
    get bonding_period() {
        return this.get('bonding_period');
    }
    get min_service_period() {
        return this.get('min_service_period');
    }
    get startup_grace_period() {
        return this.get('startup_grace_period');
    }
    get entry_request_fee() {
        return this.get('entry_request_fee');
    }
}
exports.RoleParameters = RoleParameters;
function registerRolesTypes() {
    try {
        const typeRegistry = types_1.getTypeRegistry();
        typeRegistry.register({
            Role,
            RoleParameters,
            Request: '(AccountId, MemberId, Role, BlockNumber)',
            Requests: 'Vec<Request>',
            Actor
        });
    }
    catch (err) {
        console.error('Failed to register custom types of roles module', err);
    }
}
exports.registerRolesTypes = registerRolesTypes;
