import BN from 'bn.js';
import { ElectionStage, Seat } from '@joystream/types/council';
import { Option } from '@polkadot/types';
import { BlockNumber, Balance, AccountId } from '@polkadot/types/interfaces';
import { DerivedBalances } from '@polkadot/api-derive/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { WorkerId } from '@joystream/types/working-group';
import { Profile, MemberId } from '@joystream/types/members';

// KeyringPair type extended with mandatory "meta.name"
// It's used for accounts/keys management within CLI.
// If not provided in the account json file, the meta.name value is set to "Unnamed Account"
export type NamedKeyringPair = KeyringPair & {
    meta: {
        name: string
    }
}

// Summary of the account information fetched from the api for "account:current" purposes (currently just balances)
export type AccountSummary = {
    balances: DerivedBalances
}

// Object/Tuple containing council/councilElection information (council:info).
// The tuple is useful, because that's how api.queryMulti returns the results.
export type CouncilInfoTuple = Parameters<typeof createCouncilInfoObj>;
export type CouncilInfoObj = ReturnType<typeof createCouncilInfoObj>;
// This function allows us to easily transform the tuple into the object
// and simplifies the creation of consitent Object and Tuple types (seen above).
export function createCouncilInfoObj(
    activeCouncil: Seat[],
    termEndsAt: BlockNumber,
    autoStart: Boolean,
    newTermDuration: BN,
    candidacyLimit: BN,
    councilSize: BN,
    minCouncilStake: Balance,
    minVotingStake: Balance,
    announcingPeriod: BlockNumber,
    votingPeriod: BlockNumber,
    revealingPeriod: BlockNumber,
    round: BN,
    stage: Option<ElectionStage>
) {
    return {
        activeCouncil,
        termEndsAt,
        autoStart,
        newTermDuration,
        candidacyLimit,
        councilSize,
        minCouncilStake,
        minVotingStake,
        announcingPeriod,
        votingPeriod,
        revealingPeriod,
        round,
        stage
    };
}

// Object with "name" and "value" properties, used for rendering simple CLI tables like:
// Total balance:   100 JOY
// Free calance:     50 JOY
export type NameValueObj = { name: string, value: string };

// Working groups related types
export enum WorkingGroups {
    StorageProviders = 'storageProviders'
}

// In contrast to Pioneer, currently only StorageProviders group is available in CLI
export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.StorageProviders
] as const;

// Compound working group types
export type GroupMember = {
    workerId: WorkerId;
    memberId: MemberId;
    roleAccount: AccountId;
    profile: Profile;
    stake: Balance;
    earned: Balance;
}
