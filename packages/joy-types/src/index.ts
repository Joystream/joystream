import { Enum, Option, Struct, Vec } from '@polkadot/types/codec';
import { getTypeRegistry, Text } from '@polkadot/types';
import { BlockNumber, AccountId, Balance, Hash } from '@polkadot/types/interfaces';
import { u32, bool } from '@polkadot/types/primitive';
import { Codec } from '@polkadot/types/types';

import { registerForumTypes } from './forum';
import { registerMediaTypes } from './media';
import { registerMembershipTypes } from './members';
import { registerRolesTypes } from './roles';
import { registerDiscoveryTypes } from './discovery';
import { registerVersionedStoreTypes } from './versioned-store';
import { registerVersionedStorePermissionsTypes } from './versioned-store/permissions';
import { registerStakeTypes } from './stake';
import { registerHiringTypes } from './hiring';
import { registerMintTypes } from './mint';
import { registerRecurringRewardsTypes } from './recurring-rewards';
import { registerContentWorkingGroupTypes } from './content-working-group';

export function getTextPropAsString (struct: Struct, fieldName: string): string {
  return (struct.get(fieldName) as Text).toString();
}

export function getBoolPropAsBoolean (struct: Struct, fieldName: string): boolean {
  return (struct.get(fieldName) as bool).valueOf();
}

export function getOptionPropOrUndefined <T extends Codec>
  (struct: Struct, fieldName: string): T | undefined {

  return (struct.get(fieldName) as Option<T>).unwrapOr(undefined);
}


export class OptionText extends Option.with(Text) {

  static none (): OptionText {
    return new Option(Text, null);
  }

  static some (text: string): OptionText {
    return new Option(Text, text);
  }
}

export type TransferableStake = {
  seat: Balance,
  backing: Balance
};

export type Stake = {
  new: Balance,
  transferred: Balance
};

export type Backer = {
  member: AccountId,
  stake: Balance
};

export type Seat = {
  member: AccountId,
  stake: Balance,
  backers: Backer[]
};

export type SealedVote = {
  voter: AccountId,
  commitment: Hash,
  stake: Stake,
  vote: Option<AccountId>
};

// Note: this could be named 'RuntimeUpgradeProposal' (as it is in Rust),
// but not a big deal here in JS.
export type Proposal = {
  id: u32,
  proposer: AccountId,
  stake: Balance,
  name: Text, // or AnyU8a?
  description: Text,
  wasm_hash: Hash,
  proposed_at: BlockNumber,
  status: ProposalStatus
};

export type ProposalVote = {
  voter: AccountId,
  kind: VoteKind
};

export type TallyResult = {
  proposal_id: u32,
  abstentions: u32,
  approvals: u32,
  rejections: u32,
  slashes: u32,
  status: ProposalStatus,
  finalized_at: BlockNumber
};

export class Announcing extends u32 {};
export class Voting extends u32 {};
export class Revealing extends u32 {};

export class ElectionStage extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Announcing,
        Voting,
        Revealing
      },
      value, index);
  }

  /** Create a new Announcing stage. */
  static Announcing (endsAt: BlockNumber | number): ElectionStage {
    return this.newElectionStage('Announcing', endsAt);
  }

  /** Create a new Voting stage. */
  static Voting (endsAt: BlockNumber | number): ElectionStage {
    return this.newElectionStage('Voting', endsAt);
  }

  /** Create a new Revealing stage. */
  static Revealing (endsAt: BlockNumber | number): ElectionStage {
    return this.newElectionStage('Revealing', endsAt);
  }

  static newElectionStage (stageName: string, endsAt: BlockNumber | number) {
    return new ElectionStage({ [stageName]: endsAt });
  }
}

export type AnyElectionStage = Announcing | Voting | Revealing;

export const ProposalStatuses: { [key: string ]: string } = {
  Active:    'Active',
  Cancelled: 'Cancelled',
  Expired:   'Expired',
  Approved:  'Approved',
  Rejected:  'Rejected',
  Slashed:   'Slashed'
};

export class ProposalStatus extends Enum {
  constructor (value?: any) {
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

export const VoteKinds: { [key: string ]: string } = {
  Abstain: 'Abstain',
  Approve: 'Approve',
  Reject:  'Reject',
  Slash:   'Slash'
};

export class VoteKind extends Enum {
  constructor (value?: any) {
    super([
      'Abstain',
      'Approve',
      'Reject',
      'Slash'
    ], value);
  }
}

export type ProposalVotes = [AccountId, VoteKind][];

// Treat a BTreeSet as a Vec since it is encoded in the same way.
export class BTreeSet<T extends Codec> extends Vec<T> {};

// TODO Refactor: split this function and move to corresponding modules: election and proposals.
function registerElectionAndProposalTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    // Is this enough?
    typeRegistry.register({
      BTreeSet
    });

    typeRegistry.register({
      MemoText: 'Text'
    });
    // Register parametrized enum ElectionStage:
    typeRegistry.register({
      ElectionStage
    });
    typeRegistry.register({
      ProposalStatus,
      VoteKind
    });
    typeRegistry.register({
      'ElectionStake': {
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
        'stake': 'ElectionStake',
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
      'TallyResult<BlockNumber>': {
        'proposal_id': 'u32',
        'abstentions': 'u32',
        'approvals': 'u32',
        'rejections': 'u32',
        'slashes': 'u32',
        'status': 'ProposalStatus',
        'finalized_at': 'BlockNumber'
      }
    });
  } catch (err) {
    console.error('Failed to register custom types of Joystream node', err);
  }
}

export function registerJoystreamTypes () {
  registerMembershipTypes();
  registerRolesTypes();
  registerMediaTypes();
  registerForumTypes();
  registerElectionAndProposalTypes();
  registerDiscoveryTypes();
  registerVersionedStoreTypes();
  registerVersionedStorePermissionsTypes();
  registerStakeTypes();
  registerHiringTypes();
  registerMintTypes();
  registerRecurringRewardsTypes();
  registerContentWorkingGroupTypes();
}
