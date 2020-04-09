import BN from 'bn.js';
import { ElectionStage, Seat } from '@joystream/types';
import { Option } from '@polkadot/types';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';
import { DerivedBalances } from '@polkadot/api-derive/types';
import { KeyringPair } from '@polkadot/keyring/types';

export type NamedKeyringPair = KeyringPair & {
    meta: {
        name: string
    }
}

export type AccountBalances = {
    free: Balance,
    reserved: Balance,
    total: Balance
};

export type AccountSummary = {
    balances: DerivedBalances
}

export type CouncilInfoTuple = Parameters<typeof createCouncilInfoObj>;
export type CouncilInfoObj = ReturnType<typeof createCouncilInfoObj>;
export function createCouncilInfoObj(
    activeCouncil: Seat[] | undefined,
    termEndsAt: BlockNumber | undefined,
    autoStart: Boolean | undefined,
    newTermDuration: BN | undefined,
    candidacyLimit: BN | undefined,
    councilSize: BN | undefined,
    minCouncilStake: Balance | undefined,
    minVotingStake: Balance | undefined,
    announcingPeriod: BlockNumber | undefined,
    votingPeriod: BlockNumber | undefined,
    revealingPeriod: BlockNumber | undefined,
    round: BN | undefined,
    stage: Option<ElectionStage> | undefined
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

export type NameValueObj = { name: string, value: string };
