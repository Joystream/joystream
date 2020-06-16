import BN from 'bn.js';
import { registerJoystreamTypes } from '@joystream/types/';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { QueryableStorageMultiArg } from '@polkadot/api/types';
import { formatBalance } from '@polkadot/util';
import { Hash, Balance } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';
import { Codec } from '@polkadot/types/types';
import { Option, Vec } from '@polkadot/types';
import { u32 } from '@polkadot/types/primitive';
import {
    AccountSummary,
    CouncilInfoObj, CouncilInfoTuple, createCouncilInfoObj,
    WorkingGroups,
    GroupLeadWithProfile,
    GroupMember,
} from './Types';
import { DerivedFees, DerivedBalances } from '@polkadot/api-derive/types';
import { CLIError } from '@oclif/errors';
import ExitCodes from './ExitCodes';
import { Worker, Lead as WorkerLead, WorkerId, WorkerRoleStakeProfile } from '@joystream/types/lib/working-group';
import { MemberId, Profile } from '@joystream/types/lib/members';
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/lib/recurring-rewards';
import { Stake, StakeId } from '@joystream/types/lib/stake';
import { LinkageResult } from '@polkadot/types/codec/Linkage';

export const DEFAULT_API_URI = 'wss://rome-rpc-endpoint.joystream.org:9944/';
const DEFAULT_DECIMALS = new u32(12);

// Mapping of working group to api module
export const apiModuleByGroup: { [key in WorkingGroups]: string } = {
    [WorkingGroups.StorageProviders]: 'storageWorkingGroup'
};

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future
export default class Api {
    private _api: ApiPromise;

    private constructor(originalApi:ApiPromise) {
        this._api = originalApi;
    }

    public getOriginalApi(): ApiPromise {
        return this._api;
    }

    private static async initApi(apiUri: string = DEFAULT_API_URI): Promise<ApiPromise> {
        const wsProvider:WsProvider = new WsProvider(apiUri);
        registerJoystreamTypes();
        const api = await ApiPromise.create({ provider: wsProvider });

        // Initializing some api params based on pioneer/packages/react-api/Api.tsx
        const [ properties ] = await Promise.all([
            api.rpc.system.properties()
        ]);

        const tokenSymbol = properties.tokenSymbol.unwrapOr('DEV').toString();
        const tokenDecimals = properties.tokenDecimals.unwrapOr(DEFAULT_DECIMALS).toNumber();

        // formatBlanace config
        formatBalance.setDefaults({
          decimals: tokenDecimals,
          unit: tokenSymbol
        });

        return api;
    }

    static async create(apiUri: string = DEFAULT_API_URI): Promise<Api> {
        const originalApi: ApiPromise = await Api.initApi(apiUri);
        return new Api(originalApi);
    }

    private async queryMultiOnce(queries: Parameters<typeof ApiPromise.prototype.queryMulti>[0]): Promise<Codec[]> {
        let results: Codec[] = [];

        const unsub = await this._api.queryMulti(
            queries,
            (res) => { results = res }
        );
        unsub();

        if (!results.length || results.length !== queries.length) {
            throw new CLIError('API querying issue', { exit: ExitCodes.ApiError });
        }

        return results;
    }

    async getAccountsBalancesInfo(accountAddresses:string[]): Promise<DerivedBalances[]> {
        let accountsBalances: DerivedBalances[] = await this._api.derive.balances.votingBalances(accountAddresses);

        return accountsBalances;
    }

    // Get on-chain data related to given account.
    // For now it's just account balances
    async getAccountSummary(accountAddresses:string): Promise<AccountSummary> {
        const balances: DerivedBalances = (await this.getAccountsBalancesInfo([accountAddresses]))[0];
        // TODO: Some more information can be fetched here in the future

        return { balances };
    }

    async getCouncilInfo(): Promise<CouncilInfoObj> {
        const queries: { [P in keyof CouncilInfoObj]: QueryableStorageMultiArg<"promise"> } = {
            activeCouncil:    this._api.query.council.activeCouncil,
            termEndsAt:       this._api.query.council.termEndsAt,
            autoStart:        this._api.query.councilElection.autoStart,
            newTermDuration:  this._api.query.councilElection.newTermDuration,
            candidacyLimit:   this._api.query.councilElection.candidacyLimit,
            councilSize:      this._api.query.councilElection.councilSize,
            minCouncilStake:  this._api.query.councilElection.minCouncilStake,
            minVotingStake:   this._api.query.councilElection.minVotingStake,
            announcingPeriod: this._api.query.councilElection.announcingPeriod,
            votingPeriod:     this._api.query.councilElection.votingPeriod,
            revealingPeriod:  this._api.query.councilElection.revealingPeriod,
            round:            this._api.query.councilElection.round,
            stage:            this._api.query.councilElection.stage
        }
        const results: CouncilInfoTuple = <CouncilInfoTuple> await this.queryMultiOnce(Object.values(queries));

        return createCouncilInfoObj(...results);
    }

    // TODO: This formula is probably not too good, so some better implementation will be required in the future
    async estimateFee(account: KeyringPair, recipientAddr: string, amount: BN): Promise<BN> {
        const transfer = this._api.tx.balances.transfer(recipientAddr, amount);
        const signature = account.sign(transfer.toU8a());
        const transactionByteSize:BN = new BN(transfer.encodedLength + signature.length);

        const fees: DerivedFees = await this._api.derive.balances.fees();

        const estimatedFee = fees.transactionBaseFee.add(fees.transactionByteFee.mul(transactionByteSize));

        return estimatedFee;
    }

    async transfer(account: KeyringPair, recipientAddr: string, amount: BN): Promise<Hash> {
        const txHash = await this._api.tx.balances
            .transfer(recipientAddr, amount)
            .signAndSend(account);
        return txHash;
    }

    // Working groups
    // TODO: This is a lot of repeated logic from "/pioneer/joy-roles/src/transport.substrate.ts"
    // (although simplified a little bit)
    // Hopefully this will be refactored to "joystream-js" soon
    protected singleLinkageResult<T extends Codec>(result: LinkageResult) {
        return result[0] as T;
    }

    protected multiLinkageResult<K extends Codec, V extends Codec>(result: LinkageResult): [Vec<K>, Vec<V>] {
        return [ result[0] as Vec<K>, result[1] as Vec<V> ];
    }

    protected workingGroupApiQuery(group: WorkingGroups) {
        const module = apiModuleByGroup[group];
        return this._api.query[module];
    }

    protected async memberProfileById(memberId: MemberId): Promise<Profile | null> {
        const profile = await this._api.query.members.memberProfile(memberId) as Option<Profile>;

        return profile.unwrapOr(null);
    }

    async groupLead (group: WorkingGroups): Promise <GroupLeadWithProfile | null> {
        const optLead = (await this.workingGroupApiQuery(group).currentLead()) as Option<WorkerLead>;

        if (!optLead.isSome) {
          return null;
        }

        const lead = optLead.unwrap();
        const profile = await this.memberProfileById(lead.member_id);

        if (!profile) {
            throw new Error(`Group lead profile not found! (member id: ${lead.member_id.toNumber()})`);
        }

        return { lead, profile };
    }

    protected async stakeValue (stakeId: StakeId): Promise<Balance> {
        const stake = (await this._api.query.stake.stakes(stakeId)) as Stake;
        return stake.value;
    }

    protected async workerStake (stakeProfile: WorkerRoleStakeProfile): Promise<Balance> {
        return this.stakeValue(stakeProfile.stake_id);
    }

    protected async workerTotalReward (relationshipId: RewardRelationshipId): Promise<Balance> {
        const relationship = this.singleLinkageResult<RewardRelationship>(
            await this._api.query.recurringRewards.rewardRelationships(relationshipId) as LinkageResult
        );
        return relationship.total_reward_received;
    }

    protected async groupMember (
        id: WorkerId,
        worker: Worker
      ): Promise<GroupMember> {
        const roleAccount = worker.role_account;
        const memberId = worker.member_id;

        const profile = await this.memberProfileById(memberId);

        if (!profile) {
            throw new Error(`Group member profile not found! (member id: ${memberId.toNumber()})`);
        }

        let stakeValue: Balance = this._api.createType("Balance", 0);
        if (worker.role_stake_profile && worker.role_stake_profile.isSome) {
          stakeValue = await this.workerStake(worker.role_stake_profile.unwrap());
        }

        let earnedValue: Balance = this._api.createType("Balance", 0);
        if (worker.reward_relationship && worker.reward_relationship.isSome) {
          earnedValue = await this.workerTotalReward(worker.reward_relationship.unwrap());
        }

        return ({
            workerId: id,
            roleAccount,
            memberId,
            profile,
            stake: stakeValue,
            earned: earnedValue
        });
    }

    async groupMembers (group: WorkingGroups): Promise<GroupMember[]> {
        const nextId = (await this.workingGroupApiQuery(group).nextWorkerId()) as WorkerId;

        // This is chain specfic, but if next id is still 0, it means no curators have been added yet
        if (nextId.eq(0)) {
          return [];
        }

        const [ workerIds, workers ] = this.multiLinkageResult<WorkerId, Worker>(
            (await this.workingGroupApiQuery(group).workerById()) as LinkageResult
        );

        let groupMembers: GroupMember[] = [];
        for (let [ index, worker ] of Object.entries(workers.toArray())) {
            const workerId = workerIds[parseInt(index)];
            groupMembers.push(await this.groupMember(workerId, worker));
        }

        return groupMembers.reverse();
      }
}
