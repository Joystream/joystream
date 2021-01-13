import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { Bytes, Option, u32, Vec, StorageKey } from '@polkadot/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { AccountId, MemberId } from '@joystream/types/common'
import {
  Application,
  ApplicationId,
  ApplicationIdToWorkerIdMap,
  Worker,
  WorkerId,
  Opening as WorkingGroupOpening,
  OpeningId,
  StakePolicy,
} from '@joystream/types/working-group'

import { AccountInfo, Balance, Event, EventRecord } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { QueryableConsts, QueryableStorage, SubmittableExtrinsic, SubmittableExtrinsics } from '@polkadot/api/types'
import { Sender, LogLevel } from './sender'
import { Utils } from './utils'
import { types } from '@joystream/types'

import { ProposalId } from '@joystream/types/proposals'
import { v4 as uuid } from 'uuid'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { initializeContentDir, InputParser } from '@joystream/cd-schemas'
import { OperationType } from '@joystream/types/content-directory'
import { ContentId, DataObject } from '@joystream/types/media'
import Debugger from 'debug'
import { CouncilMemberOf } from '@joystream/types/council'
import { DispatchError } from '@polkadot/types/interfaces/system'

export enum WorkingGroups {
  StorageWorkingGroup = 'storageWorkingGroup',
  ContentDirectoryWorkingGroup = 'contentDirectoryWorkingGroup',
  MembershipWorkingGroup = 'membershipWorkingGroup',
  ForumWorkingGroup = 'forumWorkingGroup',
}

export class ApiFactory {
  private readonly api: ApiPromise
  private readonly keyring: Keyring
  // source of funds for all new accounts
  private readonly treasuryAccount: string

  public static async create(
    provider: WsProvider,
    treasuryAccountUri: string,
    sudoAccountUri: string
  ): Promise<ApiFactory> {
    const debug = Debugger('api-factory')
    let connectAttempts = 0
    while (true) {
      connectAttempts++
      debug(`Connecting to chain, attempt ${connectAttempts}..`)
      try {
        const api = await ApiPromise.create({ provider, types })

        // Wait for api to be connected and ready
        await api.isReady

        // If a node was just started up it might take a few seconds to start producing blocks
        // Give it a few seconds to be ready.
        await Utils.wait(5000)

        return new ApiFactory(api, treasuryAccountUri, sudoAccountUri)
      } catch (err) {
        if (connectAttempts === 3) {
          throw new Error('Unable to connect to chain')
        }
      }
      await Utils.wait(5000)
    }
  }

  constructor(api: ApiPromise, treasuryAccountUri: string, sudoAccountUri: string) {
    this.api = api
    this.keyring = new Keyring({ type: 'sr25519' })
    this.treasuryAccount = this.keyring.addFromUri(treasuryAccountUri).address
    this.keyring.addFromUri(sudoAccountUri)
  }

  public getApi(label: string): Api {
    return new Api(this.api, this.treasuryAccount, this.keyring, label)
  }

  public close(): void {
    this.api.disconnect()
  }
}

export class Api {
  private readonly api: ApiPromise
  private readonly sender: Sender
  private readonly keyring: Keyring
  // source of funds for all new accounts
  private readonly treasuryAccount: string

  constructor(api: ApiPromise, treasuryAccount: string, keyring: Keyring, label: string) {
    this.api = api
    this.keyring = keyring
    this.treasuryAccount = treasuryAccount
    this.sender = new Sender(api, keyring, label)
  }

  public get tx(): SubmittableExtrinsics<'promise'> {
    return this.api.tx
  }

  public get query(): QueryableStorage<'promise'> {
    return this.api.query
  }

  public get consts(): QueryableConsts<'promise'> {
    return this.api.consts
  }

  public get derive() {
    return this.api.derive
  }

  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    sender: AccountId | string
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(tx, sender)
  }

  public async makeSudoCall(tx: SubmittableExtrinsic<'promise'>): Promise<ISubmittableResult> {
    const sudo = await this.api.query.sudo.key()
    return this.signAndSend(this.api.tx.sudo.sudo(tx), sudo)
  }

  public enableDebugTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Debug)
  }

  public enableVerboseTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Verbose)
  }

  // Create new keys and store them in the shared keyring
  public createKeyPairs(n: number): KeyringPair[] {
    const nKeyPairs: KeyringPair[] = []
    for (let i = 0; i < n; i++) {
      // What are risks of generating duplicate keys this way?
      // Why not use a deterministic /TestKeys/N and increment N
      nKeyPairs.push(this.keyring.addFromUri(i + uuid().substring(0, 8)))
    }
    return nKeyPairs
  }

  // Well known WorkingGroup enum defined in runtime
  public getWorkingGroupString(workingGroup: WorkingGroups): string {
    switch (workingGroup) {
      case WorkingGroups.StorageWorkingGroup:
        return 'Storage'
      case WorkingGroups.ContentDirectoryWorkingGroup:
        return 'Content'
      case WorkingGroups.ForumWorkingGroup:
        return 'Forum'
      case WorkingGroups.MembershipWorkingGroup:
        return 'Membership'
      default:
        throw new Error(`Invalid working group string representation: ${workingGroup}`)
    }
  }

  public getBlockDuration(): BN {
    return this.api.createType('Moment', this.api.consts.babe.expectedBlockTime)
  }

  public durationInMsFromBlocks(durationInBlocks: number): number {
    return this.getBlockDuration().muln(durationInBlocks).toNumber()
  }

  public getValidatorCount(): Promise<BN> {
    return this.api.query.staking.validatorCount<u32>()
  }

  public getMemberIds(controllerAddress: string): Promise<MemberId[]> {
    return this.api.query.members.memberIdsByControllerAccountId<Vec<MemberId>>(controllerAddress)
  }

  public getBestBlock(): Promise<BN> {
    return this.api.derive.chain.bestNumber()
  }

  public async getControllerAccountOfMember(id: MemberId): Promise<string> {
    return (await this.api.query.members.membershipById(id)).controller_account.toString()
  }

  public async getBalance(address: string): Promise<Balance> {
    const accountData: AccountInfo = await this.api.query.system.account<AccountInfo>(address)
    return accountData.data.free
  }

  public async transferBalance({
    from,
    to,
    amount,
  }: {
    from: string
    to: string
    amount: BN
  }): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.balances.transfer(to, amount), from)
  }

  public async treasuryTransferBalance(to: string, amount: BN): Promise<ISubmittableResult> {
    return this.transferBalance({ from: this.treasuryAccount, to, amount })
  }

  public treasuryTransferBalanceToAccounts(destinations: string[], amount: BN): Promise<ISubmittableResult[]> {
    return Promise.all(
      destinations.map((account) => this.transferBalance({ from: this.treasuryAccount, to: account, amount }))
    )
  }

  public async getMembershipFee(): Promise<BN> {
    return this.api.query.members.membershipPrice()
  }

  // This method does not take into account weights and the runtime weight to fees computation!
  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): BN {
    const byteFee: BN = this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee)
    return Utils.calcTxLength(tx).mul(byteFee)
  }

  // The estimation methods here serve to allow fixtures to estimate fees ahead of
  // constructing transactions which may have dependencies on other transactions finalizing

  public estimateBuyMembershipFee(account: string, handle: string): BN {
    return this.estimateTxFee(
      this.api.tx.members.buyMembership({ root_account: account, controller_account: account, handle })
    )
  }

  public estimateApplyForCouncilFee(membershipId: number | MemberId, account: string, stake: BN): BN {
    return this.estimateTxFee(this.api.tx.council.announceCandidacy(membershipId, account, account, stake))
  }

  public estimateVoteForCouncilFee(memberId: string, salt: string, stake: BN): BN {
    const hashedVote: string = Utils.hashVote(memberId, salt)
    return this.estimateTxFee(this.api.tx.referendum.vote(hashedVote, stake))
  }

  public estimateRevealVoteFee(memberId: string, salt: string): BN {
    return this.estimateTxFee(this.api.tx.referendum.revealVote(salt, memberId))
  }

  public estimateVoteForProposalFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsEngine.vote(
        this.api.createType('MemberId', 0),
        this.api.createType('ProposalId', 0),
        'Approve',
        'rationale-text'
      )
    )
  }

  public estimateProposeRuntimeUpgradeFee(title: string, description: string, runtime: Bytes | string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0,
          title,
          description,
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          RuntimeUpgrade: runtime,
        }
      )
    )
  }

  public estimateProposeTextFee(title: string, description: string, text: string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0,
          title,
          description,
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          Text: text,
        }
      )
    )
  }

  public estimateProposeSpendingFee(title: string, description: string, balance: BN, destination: string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0,
          title,
          description,
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          Spending: [balance, destination],
        }
      )
    )
  }

  public estimateProposeValidatorCountFee(title: string, description: string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0,
          title,
          description,
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          SetValidatorCount: 1,
        }
      )
    )
  }

  public estimateAddOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].addOpening('Human readable text', 'Regular', null, null))
  }

  public estimateApplyOnOpeningFee(account: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].applyOnOpening({
        member_id: this.api.createType('MemberId', 0),
        opening_id: this.api.createType('OpeningId', 0),
        role_account_id: account,
        reward_account_id: account,
        description:
          'Some testing text used for estimation purposes which is longer than text expected during the test',
        stake_parameters: null,
      })
    )
  }

  public estimateFillOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].fillOpening(0, this.api.createType('ApplicationIdSet', [0])))
  }

  public estimateIncreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].increaseStake(this.api.createType('WorkerId', 0), 0))
  }

  public estimateDecreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].decreaseStake(this.api.createType('WorkerId', 0), 0))
  }

  public estimateUpdateRoleAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].updateRoleAccount(this.api.createType('WorkerId', 0), address))
  }

  public estimateUpdateRewardAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].updateRewardAccount(this.api.createType('WorkerId', 0), address))
  }

  public estimateLeaveRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].leaveRole(this.api.createType('WorkerId', 0)))
  }

  public estimateWithdrawApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].withdrawApplication(this.api.createType('ApplicationId', 0)))
  }

  public estimateSlashStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].slashStake(this.api.createType('WorkerId', 0), {
        slashing_text: 'some-slash-reason-text',
        slashing_amount: 100,
      })
    )
  }

  public estimateTerminateRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].terminateRole(this.api.createType('WorkerId', 0), {
        slashing_text: 'termination-reason-text',
        slashing_amount: 100,
      })
    )
  }

  public estimateProposeCreateWorkingGroupLeaderOpeningFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0,
          title: 'storage-lead-opening',
          description: 'long description for lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          AddWorkingGroupLeaderOpening: {
            description: 'long description of opening details',
            stake_policy: null, // Option.with(StakePolicy),
            reward_per_block: null, // Option.with(u128),
            working_group: 'Storage',
          },
        }
      )
    )
  }

  public estimateProposeFillLeaderOpeningFee(): BN {
    const fillOpeningParameters = this.api.createType('FillOpeningParameters', {
      opening_id: this.api.createType('OpeningId', 0),
      successful_application_id: this.api.createType('ApplicationId', 0),
      working_group: 'Storage',
    })

    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'storage-lead-fill-opening',
          description: 'long description for filling lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          FillWorkingGroupLeaderOpening: fillOpeningParameters,
        }
      )
    )
  }

  public estimateProposeTerminateLeaderRoleFee(): BN {
    const terminateRoleParameters = this.api.createType('TerminateRoleParameters', {
      worker_id: this.api.createType('WorkerId', 0),
      penalty: this.api.createType('Penalty', {
        slashing_text: 'reason for slashing',
        slashing_amount: 100,
      }),
      working_group: 'Storage',
    })

    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'terminate-lead',
          description: 'long description for terminating lead',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          TerminateWorkingGroupLeaderRole: terminateRoleParameters,
        }
      )
    )
  }

  public estimateProposeLeaderRewardFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'storage-lead-opening',
          description: 'long description for lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          SetWorkingGroupLeaderReward: [this.api.createType('WorkerId', 1), 1000, 'Storage'],
        }
      )
    )
  }

  public estimateProposeDecreaseLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'storage-lead-opening',
          description: 'long description for lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          DecreaseWorkingGroupLeaderStake: [this.api.createType('WorkerId', 1), 1000, 'Storage'],
        }
      )
    )
  }

  public estimateProposeSlashLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'storage-lead-opening',
          description: 'long description for lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          SlashWorkingGroupLeaderStake: [
            this.api.createType('WorkerId', 1),
            {
              slashing_text: 'reason for slashing',
              slashing_amount: 100,
            },
            'Storage',
          ],
        }
      )
    )
  }

  // rename this to estimateProposeWorkingGroupBudgetFee
  public estimateProposeWorkingGroupMintCapacityFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: 0, // should we be doing this.api.createType('MemberId', 0) instead?
          title: 'storage-lead-opening',
          description: 'long description for lead opening',
          staking_account_id: null,
          exact_execution_block: null,
        },
        {
          SetWorkingGroupBudgetCapacity: [1000, 'Storage'],
        }
      )
    )
  }

  // Council and elections

  // Move into fixture
  private applyForCouncilElection(
    membershipId: MemberId | number,
    account: string,
    amount: BN
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx.council.announceCandidacy(membershipId, account, account, amount),
      account
    )
  }

  public batchApplyForCouncilElection(
    membershipIds: number[], // would be better to pass Map<membershipId, account>
    accounts: string[], //
    amount: BN
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account, ix) => this.applyForCouncilElection(membershipIds[ix], account, amount))
    )
  }

  /*
    We can't manually control the election stages anymore.

    Tests must take these constants into account:
    Council:
      AnnouncingPeriodDuration: BlockNumber = 15;
      IdlePeriodDuration: BlockNumber = 27;
    Referendum:
      VoteStageDuration: BlockNumber = 5;
      RevealStageDuration: BlockNumber = 7;
      MinimumVotingStake: u64 = 10000;

  public async getAnnouncingPeriod(): Promise<BN> {
    return this.api.query.councilElection.announcingPeriod<BlockNumber>()
  }

  public async getVotingPeriod(): Promise<BN> {
    return this.api.query.councilElection.votingPeriod<BlockNumber>()
  }

  public async getRevealingPeriod(): Promise<BN> {
    return this.api.query.councilElection.revealingPeriod<BlockNumber>()
  }

  public async getCouncilSize(): Promise<BN> {
    return this.api.query.councilElection.councilSize<u32>()
  }

  public async getCandidacyLimit(): Promise<BN> {
    return this.api.query.councilElection.candidacyLimit<u32>()
  }

  public async getNewTermDuration(): Promise<BN> {
    return this.api.query.councilElection.newTermDuration<BlockNumber>()
  }

  public async getMinCouncilStake(): Promise<BN> {
    return this.api.query.councilElection.minCouncilStake<BalanceOf>()
  }

  public async getMinVotingStake(): Promise<BN> {
    return this.api.query.councilElection.minVotingStake<BalanceOf>()
  }
  */

  private voteForCouncilMember(
    voterAccountId: string,
    nominee: string, // FIXME: -> MemberId | number,
    salt: string,
    stake: BN
  ): Promise<ISubmittableResult> {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.sender.signAndSend(this.api.tx.referendum.vote(hashedVote, stake), voterAccountId)
  }

  public batchVoteForCouncilMember(
    accounts: string[],
    nominees: string[],
    salts: string[],
    stake: BN
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account, index) => this.voteForCouncilMember(account, nominees[index], salts[index], stake))
    )
  }

  private revealVote(account: string, nominee: string, salt: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.referendum.revealVote(salt, nominee), account)
  }

  public batchRevealVote(voterAccountIds: string[], nominees: string[], salt: string[]): Promise<ISubmittableResult[]> {
    return Promise.all(
      voterAccountIds.map(async (account, index) => {
        return this.revealVote(account, nominees[index], salt[index])
      })
    )
  }

  public sudoSetCouncilBudget(capacity: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.council.setBudget(capacity))
  }

  public getCouncilMembers(): Promise<CouncilMemberOf[]> {
    return this.api.query.council.councilMembers()
  }

  public async getCouncilControllerAccounts(): Promise<string[]> {
    const council = await this.getCouncilMembers()
    const memberIds = council.map((member) => member.membership_id)
    return Promise.all(memberIds.map((id) => this.getControllerAccountOfMember(id)))
  }

  public findEventRecord(events: EventRecord[], section: string, method: string): EventRecord | undefined {
    return events.find((record) => record.event.section === section && record.event.method === method)
  }

  public getErrorNameFromExtrinsicFailedRecord(result: ISubmittableResult): string | undefined {
    const failed = result.findRecord('system', 'ExtrinsicFailed')
    if (!failed) {
      return
    }
    const record = failed as EventRecord
    const {
      event: { data },
    } = record
    const err = data[0] as DispatchError
    if (err.isModule) {
      try {
        const { name } = this.api.registry.findMetaError(err.asModule)
        return name
      } catch (findmetaerror) {
        //
      }
    }
  }

  public findMemberRegisteredEvent(events: EventRecord[]): MemberId | undefined {
    const record = this.findEventRecord(events, 'members', 'MemberRegistered')
    if (record) {
      return record.event.data[0] as MemberId
    }
  }

  public findProposalCreatedEvent(events: EventRecord[]): ProposalId | undefined {
    const record = this.findEventRecord(events, 'proposalsEngine', 'ProposalCreated')
    if (record) {
      return record.event.data[1] as ProposalId
    }
  }

  public findOpeningAddedEvent(events: EventRecord[], workingGroup: WorkingGroups): OpeningId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'OpeningAdded')
    if (record) {
      // Event data is not a tuple, so shouldn't this just be: return (record.event.data as unknown) as OpeningId
      return record.event.data[0] as OpeningId
    }
  }

  public findLeaderSetEvent(events: EventRecord[], workingGroup: WorkingGroups): WorkerId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'LeaderSet')
    if (record) {
      return (record.event.data as unknown) as WorkerId
    }
  }

  public findTerminatedLeaderEvent(events: EventRecord[], workingGroup: WorkingGroups): EventRecord | undefined {
    return this.findEventRecord(events, workingGroup, 'TerminatedLeader')
  }

  public findWorkerRewardAmountUpdatedEvent(
    events: EventRecord[],
    workingGroup: WorkingGroups,
    workerId: WorkerId
  ): WorkerId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'WorkerRewardAmountUpdated')
    if (record) {
      const id = (record.event.data[0] as unknown) as WorkerId
      if (id.eq(workerId)) {
        return workerId
      }
    }
  }

  public findStakeDecreasedEvent(events: EventRecord[], workingGroup: WorkingGroups): EventRecord | undefined {
    return this.findEventRecord(events, workingGroup, 'StakeDecreased')
  }

  public findStakeSlashedEvent(events: EventRecord[], workingGroup: WorkingGroups): EventRecord | undefined {
    return this.findEventRecord(events, workingGroup, 'StakeSlashed')
  }

  public findBudgetSetEvent(events: EventRecord[], workingGroup: WorkingGroups): BN | undefined {
    const record = this.findEventRecord(events, workingGroup, 'BudgetSet')
    if (record) {
      return (record.event.data[0] as unknown) as BN
    }
  }

  // Resolves to true when proposal finalized and executed successfully
  // Resolved to false when proposal finalized and execution fails
  public waitForProposalToFinalize(id: ProposalId): Promise<[boolean, EventRecord[]]> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (
            record.event.method &&
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[0].eq(id) &&
            record.event.data[1].toString().includes('Executed')
          ) {
            unsubscribe()
            resolve([true, events])
          } else if (
            record.event.method &&
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[0].eq(id) &&
            record.event.data[1].toString().includes('ExecutionFailed')
          ) {
            unsubscribe()
            resolve([false, events])
          }
        })
      })
    })
  }

  public findOpeningFilledEvent(
    events: EventRecord[],
    workingGroup: WorkingGroups
  ): ApplicationIdToWorkerIdMap | undefined {
    const record = this.findEventRecord(events, workingGroup, 'OpeningFilled')
    if (record) {
      return (record.event.data[1] as unknown) as ApplicationIdToWorkerIdMap
    }
  }

  // Looks for the first occurance of an expected event, and resolves.
  // Use this when the event we are expecting is not particular to a specific extrinsic
  // that is being tracked. So these would be events emitted when on_finalize, on_initialize
  // on_runtime_upgrade.
  public waitForSystemEvent(eventName: string): Promise<Event> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === eventName) {
            unsubscribe()
            resolve(record.event)
          }
        })
      })
    })
  }

  public async getWorkingGroupBudget(module: WorkingGroups): Promise<BN> {
    return this.api.query[module].budget()
  }

  /* Move proposeX methods into fixtures

  public async proposeRuntime(
    account: string,
    title: string,
    description: string,
    runtime: Bytes | string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: memberId,
          title,
          description,
          staking_account_id: account,
          exact_execution_block: null,
        },
        {
          RuntimeUpgrade: runtime,
        }
      ),
      account
    )
  }

  public async proposeText(
    account: string,
    title: string,
    description: string,
    text: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: memberId,
          title,
          description,
          staking_account_id: account,
          exact_execution_block: null,
        },
        {
          Text: text,
        }
      ),
      account
    )
  }

  public async proposeSpending(
    account: string,
    title: string,
    description: string,
    balance: BN,
    destination: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: memberId,
          title,
          description,
          staking_account_id: account,
          exact_execution_block: null,
        },
        {
          Spending: [balance, destination],
        }
      ),
      account
    )
  }

  public async proposeValidatorCount(
    account: string,
    title: string,
    description: string,
    validatorCount: BN
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: memberId,
          title,
          description,
          staking_account_id: account,
          exact_execution_block: null,
        },
        {
          SetValidatorCount: validatorCount,
        }
      ),
      account
    )
  }

  public async proposeCreateWorkingGroupLeaderOpening(
    account: string,
    title: string,
    description: string,
    workingGroup: WorkingGroups
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createProposal(
        {
          member_id: memberId,
          title,
          description,
          staking_account_id: account,
          exact_execution_block: null,
        },
        {
          AddWorkingGroupLeaderOpening: {
            description,
            stake_policy: null, // Option.with(StakePolicy),
            reward_per_block: null, // Option.with(u128),
            working_group: workingGroup,
          },
        }
      ),
      account
    )
  }

  public async proposeFillLeaderOpening(fillOpening: {
    account: string
    title: string
    description: string
    proposalStake: BN
    openingId: OpeningId
    successfulApplicationId: ApplicationId
    amountPerPayout: BN
    nextPaymentAtBlock: BN
    payoutInterval: BN
    workingGroup: string
  }): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(fillOpening.account))[0]

    const fillOpeningParameters: FillOpeningParameters = this.api.createType('FillOpeningParameters', {
      opening_id: fillOpening.openingId,
      successful_application_id: fillOpening.successfulApplicationId,
      reward_policy: this.api.createType('Option<RewardPolicy>', {
        amount_per_payout: fillOpening.amountPerPayout as Balance,
        next_payment_at_block: fillOpening.nextPaymentAtBlock as BlockNumber,
        payout_interval: this.api.createType('Option<u32>', fillOpening.payoutInterval),
      }),
      working_group: this.api.createType('WorkingGroup', fillOpening.workingGroup),
    })

    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        memberId,
        fillOpening.title,
        fillOpening.description,
        fillOpening.proposalStake,
        fillOpeningParameters
      ),
      fillOpening.account
    )
  }

  public async proposeTerminateLeaderRole(
    account: string,
    title: string,
    description: string,
    proposalStake: BN,
    leadWorkerId: WorkerId,
    rationale: string,
    slash: boolean,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createTerminateWorkingGroupLeaderRoleProposal(
        memberId,
        title,
        description,
        proposalStake,
        {
          'worker_id': leadWorkerId,
          rationale,
          slash,
          'working_group': workingGroup,
        }
      ),
      account
    )
  }

  public async proposeLeaderReward(
    account: string,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetWorkingGroupLeaderRewardProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        this.api.createType('WorkingGroup', workingGroup)
      ),
      account
    )
  }

  public async proposeDecreaseLeaderStake(
    account: string,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        this.api.createType('WorkingGroup', workingGroup)
      ),
      account
    )
  }

  public async proposeSlashLeaderStake(
    account: string,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        this.api.createType('WorkingGroup', workingGroup)
      ),
      account
    )
  }

  public async proposeWorkingGroupMintCapacity(
    account: string,
    title: string,
    description: string,
    proposalStake: BN,
    mintCapacity: BN,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        memberId,
        title,
        description,
        proposalStake,
        mintCapacity,
        this.api.createType('WorkingGroup', workingGroup)
      ),
      account
    )
  }
  */

  // Council member votes Approve on proposal
  public async approveProposal(councilMemberId: MemberId, proposal: ProposalId): Promise<ISubmittableResult> {
    const controllerAccount = await this.getControllerAccountOfMember(councilMemberId)
    return this.sender.signAndSend(
      this.api.tx.proposalsEngine.vote(councilMemberId, proposal, 'Approve', 'rationale'),
      controllerAccount
    )
  }

  // Make each council member vote 'Approve' on the proposal
  public async batchApproveProposal(proposalId: ProposalId): Promise<ISubmittableResult[]> {
    const councilMemberIds = (await this.getCouncilMembers()).map((member) => member.membership_id)
    return Promise.all(
      councilMemberIds.map(async (memberId) => {
        return this.approveProposal(memberId, proposalId)
      })
    )
  }

  // Working Groups

  // Call by lead to create a worker 'Regular' opening
  public async addRegularWorkerOpening(
    module: WorkingGroups,
    leaderRoleAccount: string,
    description: string,
    stakePolicy?: StakePolicy,
    rewardPerBlock?: number
  ): Promise<ISubmittableResult> {
    const reward = this.api.createType('Option<Balance>', rewardPerBlock)
    const policy = this.api.createType('Option<StakePolicy>', stakePolicy)
    return this.sender.signAndSend(
      this.api.tx[module].addOpening(description, 'Regular', policy, reward),
      leaderRoleAccount
    )
  }

  // Sudo call to create a lead opening
  public async addLeaderOpening(
    module: WorkingGroups,
    description: string,
    stakePolicy?: StakePolicy,
    rewardPerBlock?: number
  ): Promise<ISubmittableResult> {
    const reward = this.api.createType('Option<Balance>', rewardPerBlock)
    const policy = this.api.createType('Option<StakePolicy>', stakePolicy)
    return this.makeSudoCall(this.api.tx[module].addOpening(description, 'Leader', policy, reward))
  }

  public async applyOnOpening(
    account: string,
    roleAccountAddress: string,
    openingId: OpeningId,
    stake: BN,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx[module].applyOnOpening({
        member_id: memberId,
        opening_id: openingId,
        role_account_id: roleAccountAddress,
        reward_account_id: roleAccountAddress,
        description: text,
        stake_parameters: {
          stake,
          staking_account_id: account,
        },
      }),
      account
    )
  }

  public async batchApplyOnOpening(
    accounts: string[],
    openingId: OpeningId,
    stake: BN,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account) => this.applyOnOpening(account, account, openingId, stake, text, module))
    )
  }

  // Leader fills openning
  public async fillOpening(
    leaderRoleAccount: string,
    openingId: OpeningId,
    applicationIds: ApplicationId[],
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx[module].fillOpening(openingId, this.api.createType('ApplicationIdSet', applicationIds)),
      leaderRoleAccount
    )
  }

  public async sudoFillOpening(
    openingId: OpeningId,
    applicationIds: ApplicationId[],
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.makeSudoCall(
      this.api.tx[module].fillOpening(openingId, this.api.createType('ApplicationIdSet', applicationIds))
    )
  }

  public async increaseStake(
    workerRoleAccount: string,
    workerId: WorkerId,
    amount: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].increaseStake(workerId, amount), workerRoleAccount)
  }

  public async decreaseStake(
    leader: string,
    workerId: WorkerId,
    amount: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].decreaseStake(workerId, amount), leader)
  }

  public async slashStake(
    leader: string,
    workerId: WorkerId,
    amount: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx[module].slashStake(workerId, {
        slashing_text: 'slash reason',
        slashing_amount: amount,
      }),
      leader
    )
  }

  public async updateRoleAccount(
    worker: string,
    workerId: WorkerId,
    newRoleAccount: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].updateRoleAccount(workerId, newRoleAccount), worker)
  }

  public async updateRewardAccount(
    worker: string,
    workerId: WorkerId,
    newRewardAccount: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].updateRewardAccount(workerId, newRewardAccount), worker)
  }

  public async withdrawApplication(
    account: string,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].withdrawApplication(applicationId), account)
  }

  public async batchWithdrawActiveApplications(
    applicationIds: ApplicationId[],
    module: WorkingGroups
  ): Promise<ISubmittableResult[]> {
    const entries: [StorageKey, Application][] = await this.api.query[module].applicationById.entries<Application>()

    return Promise.all(
      entries
        .filter(([idKey]) => {
          return applicationIds.includes(idKey.args[0] as ApplicationId)
        })
        .map(([idKey, application]) => ({
          id: idKey.args[0] as ApplicationId,
          account: application.role_account_id.toString(),
        }))
        .map(({ id, account }) => this.withdrawApplication(account, id, module))
    )
  }

  public async terminateRole(leader: string, workerId: WorkerId, module: WorkingGroups): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].terminateRole(workerId, null), leader)
  }

  public async leaveRole(account: string, workerId: WorkerId, module: WorkingGroups): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].leaveRole(workerId), account)
  }

  public async batchLeaveRole(workerIds: WorkerId[], module: WorkingGroups): Promise<ISubmittableResult[]> {
    return Promise.all(
      workerIds.map(async (workerId) => {
        // get role_account of worker
        const worker = await this.getWorkerById(workerId, module)
        return this.leaveRole(worker.role_account_id.toString(), workerId, module)
      })
    )
  }

  public async getWorkingGroupOpening(id: OpeningId, group: WorkingGroups): Promise<WorkingGroupOpening> {
    return await this.api.query[group].openingById<WorkingGroupOpening>(id)
  }

  public async getWorkers(module: WorkingGroups): Promise<Worker[]> {
    return (await this.api.query[module].workerById.entries<Worker>()).map((workerWithId) => workerWithId[1])
  }

  public async getWorkerById(id: WorkerId, module: WorkingGroups): Promise<Worker> {
    return await this.api.query[module].workerById<Worker>(id)
  }

  public async isWorker(workerId: WorkerId, module: WorkingGroups): Promise<boolean> {
    const workersAndIds: [StorageKey, Worker][] = await this.api.query[module].workerById.entries<Worker>()
    const index: number = workersAndIds.findIndex((workersAndId) => workersAndId[0].args[0].eq(workerId))
    return index !== -1
  }

  public async getApplicationsIdsByRoleAccount(address: string, module: WorkingGroups): Promise<ApplicationId[]> {
    const applicationsAndIds = await this.api.query[module].applicationById.entries<Application>()
    return applicationsAndIds
      .map((applicationWithId) => {
        const application: Application = applicationWithId[1]
        return application.role_account_id.toString() === address
          ? (applicationWithId[0].args[0] as ApplicationId)
          : undefined
      })
      .filter((id) => id !== undefined) as ApplicationId[]
  }

  public async getApplicationById(id: ApplicationId, module: WorkingGroups): Promise<Application> {
    return this.api.query[module].applicationById<Application>(id)
  }

  // Note: some applications for closed openings might still be returned if
  // applicantion was not yet withdrawn
  public async getApplicantRoleAccounts(filterActiveIds: ApplicationId[], module: WorkingGroups): Promise<string[]> {
    const entries: [StorageKey, Application][] = await this.api.query[module].applicationById.entries<Application>()

    const applications = entries
      .filter(([idKey]) => {
        return filterActiveIds.includes(idKey.args[0] as ApplicationId)
      })
      .map(([, application]) => application)

    return applications.map((application) => application.role_account_id.toString())
  }

  public async getWorkerRoleAccounts(workerIds: WorkerId[], module: WorkingGroups): Promise<string[]> {
    const entries: [StorageKey, Worker][] = await this.api.query[module].workerById.entries<Worker>()

    return entries
      .filter(([idKey]) => {
        return workerIds.includes(idKey.args[0] as WorkerId)
      })
      .map(([, worker]) => worker.role_account_id.toString())
  }

  public async getWorkerStakeAmount(workerId: WorkerId, module: WorkingGroups): Promise<BN> {
    // const stakingAccount = (await this.api.query[module].workerById(workerId)).staking_account_id
    // read lock information on the account to determine how much is staked
    return new BN(0)
  }

  public async getWorkerRewardAccount(workerId: WorkerId, module: WorkingGroups): Promise<string> {
    return (await this.api.query[module].workerById(workerId)).reward_account_id.toString()
  }

  public async getLeadWorkerId(module: WorkingGroups): Promise<WorkerId | undefined> {
    return (await this.api.query[module].currentLead<Option<WorkerId>>()).unwrapOr(undefined)
  }

  public async getGroupLead(module: WorkingGroups): Promise<Worker | undefined> {
    const leadId = await this.getLeadWorkerId(module)
    return leadId ? this.getWorkerById(leadId, module) : undefined
  }

  public async getActiveWorkersCount(module: WorkingGroups): Promise<BN> {
    return this.api.query[module].activeWorkerCount<u32>()
  }

  public getMaxWorkersCount(module: WorkingGroups): BN {
    return this.api.createType('u32', this.api.consts[module].maxWorkerNumberLimit)
  }

  async sendContentDirectoryTransaction(operations: OperationType[]): Promise<ISubmittableResult> {
    const transaction = this.api.tx.contentDirectory.transaction(
      { Lead: null }, // We use member with id 0 as actor (in this case we assume this is Alice)
      operations // We provide parsed operations as second argument
    )
    const lead = (await this.getGroupLead(WorkingGroups.ContentDirectoryWorkingGroup)) as Worker
    return this.sender.signAndSend(transaction, lead.role_account_id)
  }

  public async createChannelEntity(channel: ChannelEntity): Promise<ISubmittableResult> {
    // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
    const parser = InputParser.createWithKnownSchemas(
      this.api,
      // The second argument is an array of entity batches, following standard entity batch syntax ({ className, entries }):
      [
        {
          className: 'Channel',
          entries: [channel], // We could specify multiple entries here, but in this case we only need one
        },
      ]
    )
    // We parse the input into CreateEntity and AddSchemaSupportToEntity operations
    const operations = await parser.getEntityBatchOperations()
    return this.sendContentDirectoryTransaction(operations)
  }

  public async createVideoEntity(video: VideoEntity): Promise<ISubmittableResult> {
    // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
    const parser = InputParser.createWithKnownSchemas(
      this.api,
      // The second argument is an array of entity batches, following standard entity batch syntax ({ className, entries }):
      [
        {
          className: 'Video',
          entries: [video], // We could specify multiple entries here, but in this case we only need one
        },
      ]
    )
    // We parse the input into CreateEntity and AddSchemaSupportToEntity operations
    const operations = await parser.getEntityBatchOperations()
    return this.sendContentDirectoryTransaction(operations)
  }

  public async updateChannelEntity(
    channelUpdateInput: Record<string, any>,
    uniquePropValue: Record<string, any>
  ): Promise<ISubmittableResult> {
    // Create the parser with known entity schemas (the ones in content-directory-schemas/inputs)
    const parser = InputParser.createWithKnownSchemas(this.api)

    // We can reuse InputParser's `findEntityIdByUniqueQuery` method to find entityId of the channel we
    // created in ./createChannel.ts example (normally we would probably use some other way to do it, ie.: query node)
    const CHANNEL_ID = await parser.findEntityIdByUniqueQuery(uniquePropValue, 'Channel') // Use getEntityUpdateOperations to parse the update input
    const updateOperations = await parser.getEntityUpdateOperations(
      channelUpdateInput,
      'Channel', // Class name
      CHANNEL_ID // Id of the entity we want to update
    )
    return this.sendContentDirectoryTransaction(updateOperations)
  }

  async getDataObjectByContentId(contentId: ContentId): Promise<DataObject | null> {
    const dataObject = await this.api.query.dataDirectory.dataObjectByContentId<Option<DataObject>>(contentId)
    return dataObject.unwrapOr(null)
  }

  public async initializeContentDirectory(): Promise<void> {
    const lead = await this.getGroupLead(WorkingGroups.ContentDirectoryWorkingGroup)
    if (!lead) {
      throw new Error('No Lead is set for storage wokring group')
    }
    const leadKeyPair = this.keyring.getPair(lead.role_account_id.toString())
    return initializeContentDir(this.api, leadKeyPair)
  }
}
