"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codec_1 = require("@polkadot/types/codec");
const types_1 = require("@polkadot/types");
const media_1 = require("./media");
const members_1 = require("./members");
const roles_1 = require("./roles");
const discovery_1 = require("./discovery");
class Amount extends types_1.Balance {
}
class OptionText extends codec_1.Option.with(types_1.Text) {
    static none() {
        return new codec_1.Option(types_1.Text, null);
    }
    static some(text) {
        return new codec_1.Option(types_1.Text, text);
    }
}
exports.OptionText = OptionText;
class Announcing extends types_1.BlockNumber {
}
exports.Announcing = Announcing;
class Voting extends types_1.BlockNumber {
}
exports.Voting = Voting;
class Revealing extends types_1.BlockNumber {
}
exports.Revealing = Revealing;
class ElectionStage extends codec_1.EnumType {
    constructor(value, index) {
        super({
            Announcing,
            Voting,
            Revealing
        }, value, index);
    }
    /** Create a new Announcing stage. */
    static Announcing(endsAt) {
        return this.newElectionStage(Announcing.name, endsAt);
    }
    /** Create a new Voting stage. */
    static Voting(endsAt) {
        return this.newElectionStage(Voting.name, endsAt);
    }
    /** Create a new Revealing stage. */
    static Revealing(endsAt) {
        return this.newElectionStage(Revealing.name, endsAt);
    }
    static newElectionStage(stageName, endsAt) {
        return new ElectionStage({ [stageName]: endsAt });
    }
}
exports.ElectionStage = ElectionStage;
exports.ProposalStatuses = {
    Active: 'Active',
    Cancelled: 'Cancelled',
    Expired: 'Expired',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Slashed: 'Slashed'
};
class ProposalStatus extends codec_1.Enum {
    constructor(value) {
        super([
            'Active',
            'Cancelled',
            'Expired',
            'Approved',
            'Rejected',
            'Slashed'
        ], value);
    }
}
exports.ProposalStatus = ProposalStatus;
exports.VoteKinds = {
    Abstain: 'Abstain',
    Approve: 'Approve',
    Reject: 'Reject',
    Slash: 'Slash'
};
class VoteKind extends codec_1.Enum {
    constructor(value) {
        super([
            'Abstain',
            'Approve',
            'Reject',
            'Slash'
        ], value);
    }
}
exports.VoteKind = VoteKind;
// TODO Refactor: split this function and move to corresponding modules: election and proposals.
function registerElectionAndProposalTypes() {
    try {
        const typeRegistry = types_1.getTypeRegistry();
        // Register parametrized enum ElectionStage:
        typeRegistry.register({
            Announcing,
            Voting,
            Revealing,
            ElectionStage
        });
        typeRegistry.register({
            Amount
        });
        typeRegistry.register({
            ProposalStatus,
            VoteKind
        });
        typeRegistry.register({
            'Stake': {
                'new': 'Balance',
                'transferred': 'Balance'
            },
            'Backer': {
                member: 'AccountId',
                stake: 'Balance'
            },
            'Seat': {
                member: 'AccountId',
                stake: 'Balance',
                backers: 'Vec<Backer>'
            },
            'Seats': 'Vec<Seat>',
            'SealedVote': {
                'voter': 'AccountId',
                'commitment': 'Hash',
                'stake': 'Stake',
                'vote': 'Option<AccountId>'
            },
            'TransferableStake': {
                'seat': 'Balance',
                'backing': 'Balance'
            },
            'RuntimeUpgradeProposal': {
                'id': 'u32',
                'proposer': 'AccountId',
                'stake': 'Balance',
                'name': 'Text',
                'description': 'Text',
                'wasm_hash': 'Hash',
                'proposed_at': 'BlockNumber',
                'status': 'ProposalStatus'
            },
            'TallyResult': {
                'proposal_id': 'u32',
                'abstentions': 'u32',
                'approvals': 'u32',
                'rejections': 'u32',
                'slashes': 'u32',
                'status': 'ProposalStatus',
                'finalized_at': 'BlockNumber'
            }
        });
    }
    catch (err) {
        console.error('Failed to register custom types of Joystream node', err);
    }
}
function registerJoystreamTypes() {
    members_1.registerMembershipTypes();
    roles_1.registerRolesTypes();
    media_1.registerMediaTypes();
    registerElectionAndProposalTypes();
    discovery_1.registerDiscoveryTypes();
}
exports.registerJoystreamTypes = registerJoystreamTypes;
