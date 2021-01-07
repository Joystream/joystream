import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { Bytes, Option, u32, Vec, StorageKey } from '@polkadot/types'
import { Codec, ISubmittableResult } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { MemberId } from '@joystream/types/common'

import {
  Application,
  ApplicationId,
  ApplicationIdToWorkerIdMap,
  Worker,
  WorkerId,
  Opening as WorkingGroupOpening,
  OpeningId,
} from '@joystream/types/working-group'

import { AccountInfo, Balance, BalanceOf, BlockNumber, Event, EventRecord } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender, LogLevel } from './sender'
import { Utils } from './utils'
import { types } from '@joystream/types'

import { FillOpeningParameters, ProposalDetails, ProposalId } from '@joystream/types/proposals'
import { v4 as uuid } from 'uuid'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { initializeContentDir, InputParser } from '@joystream/cd-schemas'
import { OperationType } from '@joystream/types/content-directory'
import { ContentId, DataObject } from '@joystream/types/media'
import Debugger from 'debug'

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

  public enableDebugTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Debug)
  }

  public enableVerboseTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Verbose)
  }

  public createKeyPairs(n: number): KeyringPair[] {
    const nKeyPairs: KeyringPair[] = []
    for (let i = 0; i < n; i++) {
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

  public async makeSudoCall(tx: SubmittableExtrinsic<'promise'>): Promise<ISubmittableResult> {
    const sudo = await this.api.query.sudo.key()
    return this.sender.signAndSend(this.api.tx.sudo.sudo(tx), sudo)
  }

  public async buyMembership(account: string, handle: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx.members.buyMembership({
        root_account: account,
        controller_account: account,
        handle,
      }),
      account
    )
  }

  public getMemberIds(address: string): Promise<MemberId[]> {
    return this.api.query.members.memberIdsByControllerAccountId<Vec<MemberId>>(address)
  }

  public async getBalance(address: string): Promise<Balance> {
    const accountData: AccountInfo = await this.api.query.system.account<AccountInfo>(address)
    return accountData.data.free
  }

  public async transferBalance(from: string, to: string, amount: BN): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.balances.transfer(to, amount), from)
  }

  public async treasuryTransferBalance(to: string, amount: BN): Promise<ISubmittableResult> {
    return this.transferBalance(this.treasuryAccount, to, amount)
  }

  public treasuryTransferBalanceToAccounts(to: string[], amount: BN): Promise<ISubmittableResult[]> {
    return Promise.all(to.map((account) => this.transferBalance(this.treasuryAccount, account, amount)))
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
  // constructing transactions which may have dependencies other transactions finalizing

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

  // public async getCouncilElectionStake(address: string): Promise<BN> {
  //   return (((await this.api.query.councilElection.applicantStakes(address)) as unknown) as ElectionStake).new
  // }

  private voteForCouncilMember(account: string, nominee: string, salt: string, stake: BN): Promise<ISubmittableResult> {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.sender.signAndSend(this.api.tx.referendum.vote(hashedVote, stake), account)
  }

  public batchVoteForCouncilMember(
    accounts: string[],
    nominees: string[],
    salt: string[],
    stake: BN
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account, index) => this.voteForCouncilMember(account, nominees[index], salt[index], stake))
    )
  }

  private revealVote(account: string, nominee: string, salt: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.referendum.revealVote(salt, nominee), account)
  }

  public batchRevealVote(accounts: string[], nominees: string[], salt: string[]): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account, index) => {
        return this.revealVote(account, nominees[index], salt[index])
      })
    )
  }

  // Controlling Referendum Stages with sudo
  // public sudoStartAnnouncingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
  //   return this.makeSudoCall(this.api.tx.councilElection.setStageAnnouncing(endsAtBlock))
  // }

  // public sudoStartVotingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
  //   return this.makeSudoCall(this.api.tx.councilElection.setStageVoting(endsAtBlock))
  // }

  // public sudoStartRevealingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
  //   return this.makeSudoCall(this.api.tx.councilElection.setStageRevealing(endsAtBlock))
  // }

  // rename to sudoSetCouncilBudget
  public sudoSetCouncilMintCapacity(capacity: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.council.setBudget(capacity))
  }

  public getBestBlock(): Promise<BN> {
    return this.api.derive.chain.bestNumber()
  }

  public getCouncil(): Promise<Seat[]> {
    return this.api.query.council.activeCouncil<Vec<Codec>>().then((seats) => {
      return (seats as unknown) as Seat[]
    })
  }

  public async getCouncilAccounts(): Promise<string[]> {
    const council = await this.getCouncil()
    return council.map((seat) => seat.member.toString())
  }

  public async proposeRuntime(
    account: string,
    stake: BN,
    name: string,
    description: string,
    runtime: Bytes | string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createRuntimeUpgradeProposal(memberId, name, description, stake, runtime),
      account
    )
  }

  public async proposeText(
    account: string,
    stake: BN,
    name: string,
    description: string,
    text: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createTextProposal(memberId, name, description, stake, text),
      account
    )
  }

  public async proposeSpending(
    account: string,
    title: string,
    description: string,
    stake: BN,
    balance: BN,
    destination: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSpendingProposal(memberId, title, description, stake, balance, destination),
      account
    )
  }

  public async proposeValidatorCount(
    account: string,
    title: string,
    description: string,
    stake: BN,
    validatorCount: BN
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetValidatorCountProposal(memberId, title, description, stake, validatorCount),
      account
    )
  }

  public async proposeElectionParameters(
    account: string,
    title: string,
    description: string,
    stake: BN,
    announcingPeriod: BN,
    votingPeriod: BN,
    revealingPeriod: BN,
    councilSize: BN,
    candidacyLimit: BN,
    newTermDuration: BN,
    minCouncilStake: BN,
    minVotingStake: BN
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetElectionParametersProposal(memberId, title, description, stake, {
        announcing_period: announcingPeriod,
        voting_period: votingPeriod,
        revealing_period: revealingPeriod,
        council_size: councilSize,
        candidacy_limit: candidacyLimit,
        new_term_duration: newTermDuration,
        min_council_stake: minCouncilStake,
        min_voting_stake: minVotingStake,
      }),
      account
    )
  }

  public async proposeBeginWorkingGroupLeaderApplicationReview(
    account: string,
    title: string,
    description: string,
    stake: BN,
    openingId: OpeningId,
    workingGroup: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        memberId,
        title,
        description,
        stake,
        openingId,
        this.api.createType('WorkingGroup', workingGroup)
      ),
      account
    )
  }

  public approveProposal(account: string, memberId: MemberId, proposal: ProposalId): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.proposalsEngine.vote(memberId, proposal, 'Approve'), account)
  }

  public async batchApproveProposal(proposal: ProposalId): Promise<ISubmittableResult[]> {
    const councilAccounts = await this.getCouncilAccounts()
    return Promise.all(
      councilAccounts.map(async (account) => {
        const memberId: MemberId = (await this.getMemberIds(account))[0]
        return this.approveProposal(account, memberId, proposal)
      })
    )
  }

  public getBlockDuration(): BN {
    return this.api.createType('Moment', this.api.consts.babe.expectedBlockTime)
  }

  public durationInMsFromBlocks(durationInBlocks: number): number {
    return this.getBlockDuration().muln(durationInBlocks).toNumber()
  }

  public findEventRecord(events: EventRecord[], section: string, method: string): EventRecord | undefined {
    return events.find((record) => record.event.section === section && record.event.method === method)
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
      return record.event.data[0] as OpeningId
    }
  }

  public findLeaderSetEvent(events: EventRecord[], workingGroup: WorkingGroups): WorkerId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'LeaderSet')
    if (record) {
      return (record.event.data as unknown) as WorkerId
    }
  }

  public findBeganApplicationReviewEvent(
    events: EventRecord[],
    workingGroup: WorkingGroups
  ): ApplicationId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'BeganApplicationReview')
    if (record) {
      return (record.event.data as unknown) as ApplicationId
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

  public findMintCapacityChangedEvent(events: EventRecord[], workingGroup: WorkingGroups): BN | undefined {
    const record = this.findEventRecord(events, workingGroup, 'MintCapacityChanged')
    if (record) {
      return (record.event.data[1] as unknown) as BN
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

  public findApplicationReviewBeganEvent(
    events: EventRecord[],
    workingGroup: WorkingGroups
  ): ApplicationId | undefined {
    const record = this.findEventRecord(events, workingGroup, 'BeganApplicationReview')
    if (record) {
      return (record.event.data as unknown) as ApplicationId
    }
  }

  public async getWorkingGroupMintCapacity(module: WorkingGroups): Promise<BN> {
    const mintId: MintId = await this.api.query[module].mint<MintId>()
    const mint: Mint = await this.api.query.minting.mints<Mint>(mintId)
    return mint.capacity
  }

  public getValidatorCount(): Promise<BN> {
    return this.api.query.staking.validatorCount<u32>()
  }

  public async addOpening(
    lead: string,
    openingParameters: {
      activationDelay: BN
      maxActiveApplicants: BN
      maxReviewPeriodLength: BN
      applicationStakingPolicyAmount: BN
      applicationCrowdedOutUnstakingPeriodLength: BN
      applicationReviewPeriodExpiredUnstakingPeriodLength: BN
      roleStakingPolicyAmount: BN
      roleCrowdedOutUnstakingPeriodLength: BN
      roleReviewPeriodExpiredUnstakingPeriodLength: BN
      slashableMaxCount: BN
      slashableMaxPercentPtsPerTime: BN
      fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: BN
      fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: BN
      fillOpeningFailedApplicantRoleStakeUnstakingPeriod: BN
      terminateApplicationStakeUnstakingPeriod: BN
      terminateRoleStakeUnstakingPeriod: BN
      exitRoleApplicationStakeUnstakingPeriod: BN
      exitRoleStakeUnstakingPeriod: BN
      text: string
      type: string
    },
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    const activateAt: ActivateOpeningAt = this.api.createType(
      'ActivateOpeningAt',
      openingParameters.activationDelay.eqn(0)
        ? 'CurrentBlock'
        : { ExactBlock: (await this.getBestBlock()).add(openingParameters.activationDelay) }
    )

    const commitment: WorkingGroupOpeningPolicyCommitment = this.api.createType('WorkingGroupOpeningPolicyCommitment', {
      application_rationing_policy: this.api.createType('Option<ApplicationRationingPolicy>', {
        max_active_applicants: openingParameters.maxActiveApplicants as u32,
      }),
      max_review_period_length: openingParameters.maxReviewPeriodLength as u32,
      application_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: openingParameters.applicationStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: openingParameters.applicationCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length:
          openingParameters.applicationReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: openingParameters.roleStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: openingParameters.roleCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length: openingParameters.roleReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_slashing_terms: this.api.createType('SlashingTerms', {
        Slashable: {
          max_count: openingParameters.slashableMaxCount,
          max_percent_pts_per_time: openingParameters.slashableMaxPercentPtsPerTime,
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningFailedApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningFailedApplicantRoleStakeUnstakingPeriod
      ),
      terminate_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.terminateApplicationStakeUnstakingPeriod
      ),
      terminate_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.terminateRoleStakeUnstakingPeriod
      ),
      exit_role_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.exitRoleApplicationStakeUnstakingPeriod
      ),
      exit_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.exitRoleStakeUnstakingPeriod
      ),
    })

    return this.sender.signAndSend(
      this.createAddOpeningTransaction(activateAt, commitment, openingParameters.text, openingParameters.type, module),
      lead
    )
  }

  public async sudoAddOpening(
    openingParameters: {
      activationDelay: BN
      maxActiveApplicants: BN
      maxReviewPeriodLength: BN
      applicationStakingPolicyAmount: BN
      applicationCrowdedOutUnstakingPeriodLength: BN
      applicationReviewPeriodExpiredUnstakingPeriodLength: BN
      roleStakingPolicyAmount: BN
      roleCrowdedOutUnstakingPeriodLength: BN
      roleReviewPeriodExpiredUnstakingPeriodLength: BN
      slashableMaxCount: BN
      slashableMaxPercentPtsPerTime: BN
      fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: BN
      fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: BN
      fillOpeningFailedApplicantRoleStakeUnstakingPeriod: BN
      terminateApplicationStakeUnstakingPeriod: BN
      terminateRoleStakeUnstakingPeriod: BN
      exitRoleApplicationStakeUnstakingPeriod: BN
      exitRoleStakeUnstakingPeriod: BN
      text: string
      type: string
    },
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    const activateAt: ActivateOpeningAt = this.api.createType(
      'ActivateOpeningAt',
      openingParameters.activationDelay.eqn(0)
        ? 'CurrentBlock'
        : { ExactBlock: (await this.getBestBlock()).add(openingParameters.activationDelay) }
    )

    const commitment: WorkingGroupOpeningPolicyCommitment = this.api.createType('WorkingGroupOpeningPolicyCommitment', {
      application_rationing_policy: this.api.createType('Option<ApplicationRationingPolicy>', {
        max_active_applicants: openingParameters.maxActiveApplicants as u32,
      }),
      max_review_period_length: openingParameters.maxReviewPeriodLength as u32,
      application_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: openingParameters.applicationStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: openingParameters.applicationCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length:
          openingParameters.applicationReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: openingParameters.roleStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: openingParameters.roleCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length: openingParameters.roleReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_slashing_terms: this.api.createType('SlashingTerms', {
        Slashable: {
          max_count: openingParameters.slashableMaxCount,
          max_percent_pts_per_time: openingParameters.slashableMaxPercentPtsPerTime,
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningFailedApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.fillOpeningFailedApplicantRoleStakeUnstakingPeriod
      ),
      terminate_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.terminateApplicationStakeUnstakingPeriod
      ),
      terminate_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.terminateRoleStakeUnstakingPeriod
      ),
      exit_role_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.exitRoleApplicationStakeUnstakingPeriod
      ),
      exit_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        openingParameters.exitRoleStakeUnstakingPeriod
      ),
    })

    return this.makeSudoCall(
      this.createAddOpeningTransaction(activateAt, commitment, openingParameters.text, openingParameters.type, module)
    )
  }

  public async proposeCreateWorkingGroupLeaderOpening(leaderOpening: {
    account: string
    title: string
    description: string
    proposalStake: BN
    actiavteAt: string
    maxActiveApplicants: BN
    maxReviewPeriodLength: BN
    applicationStakingPolicyAmount: BN
    applicationCrowdedOutUnstakingPeriodLength: BN
    applicationReviewPeriodExpiredUnstakingPeriodLength: BN
    roleStakingPolicyAmount: BN
    roleCrowdedOutUnstakingPeriodLength: BN
    roleReviewPeriodExpiredUnstakingPeriodLength: BN
    slashableMaxCount: BN
    slashableMaxPercentPtsPerTime: BN
    fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod: BN
    fillOpeningFailedApplicantApplicationStakeUnstakingPeriod: BN
    fillOpeningFailedApplicantRoleStakeUnstakingPeriod: BN
    terminateApplicationStakeUnstakingPeriod: BN
    terminateRoleStakeUnstakingPeriod: BN
    exitRoleApplicationStakeUnstakingPeriod: BN
    exitRoleStakeUnstakingPeriod: BN
    text: string
    workingGroup: string
  }): Promise<ISubmittableResult> {
    const commitment: WorkingGroupOpeningPolicyCommitment = this.api.createType('WorkingGroupOpeningPolicyCommitment', {
      application_rationing_policy: this.api.createType('Option<ApplicationRationingPolicy>', {
        max_active_applicants: leaderOpening.maxActiveApplicants as u32,
      }),
      max_review_period_length: leaderOpening.maxReviewPeriodLength as u32,
      application_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: leaderOpening.applicationStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: leaderOpening.applicationCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length:
          leaderOpening.applicationReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: leaderOpening.roleStakingPolicyAmount,
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: leaderOpening.roleCrowdedOutUnstakingPeriodLength,
        review_period_expired_unstaking_period_length: leaderOpening.roleReviewPeriodExpiredUnstakingPeriodLength,
      }),
      role_slashing_terms: this.api.createType('SlashingTerms', {
        Slashable: {
          max_count: leaderOpening.slashableMaxCount,
          max_percent_pts_per_time: leaderOpening.slashableMaxPercentPtsPerTime,
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.fillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.fillOpeningFailedApplicantApplicationStakeUnstakingPeriod
      ),
      fill_opening_failed_applicant_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.fillOpeningFailedApplicantRoleStakeUnstakingPeriod
      ),
      terminate_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.terminateApplicationStakeUnstakingPeriod
      ),
      terminate_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.terminateRoleStakeUnstakingPeriod
      ),
      exit_role_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.exitRoleApplicationStakeUnstakingPeriod
      ),
      exit_role_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        leaderOpening.exitRoleStakeUnstakingPeriod
      ),
    })

    const memberId: MemberId = (await this.getMemberIds(leaderOpening.account))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        memberId,
        leaderOpening.title,
        leaderOpening.description,
        leaderOpening.proposalStake,
        {
          activate_at: leaderOpening.actiavteAt,
          commitment: commitment,
          human_readable_text: leaderOpening.text,
          working_group: leaderOpening.workingGroup,
        }
      ),
      leaderOpening.account
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

  private createAddOpeningTransaction(
    actiavteAt: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    text: string,
    type: string,
    module: WorkingGroups
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx[module].addOpening(actiavteAt, commitment, text, this.api.createType('OpeningType', type))
  }

  public async acceptApplications(
    leader: string,
    openingId: OpeningId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].acceptApplications(openingId), leader)
  }

  public async beginApplicantReview(
    leader: string,
    openingId: OpeningId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].beginApplicantReview(openingId), leader)
  }

  public async sudoBeginApplicantReview(openingId: OpeningId, module: WorkingGroups): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx[module].beginApplicantReview(openingId))
  }

  public async applyOnOpening(
    account: string,
    roleAccountAddress: string,
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      this.api.tx[module].applyOnOpening(memberId, openingId, roleAccountAddress, roleStake, applicantStake, text),
      account
    )
  }

  public async batchApplyOnOpening(
    accounts: string[],
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account) =>
        this.applyOnOpening(account, account, openingId, roleStake, applicantStake, text, module)
      )
    )
  }

  public async fillOpening(
    leader: string,
    openingId: OpeningId,
    applicationIds: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx[module].fillOpening(openingId, this.api.createType('ApplicationIdSet', applicationIds), {
        amount_per_payout: amountPerPayout,
        next_payment_at_block: nextPaymentBlock,
        payout_interval: payoutInterval,
      }),
      leader
    )
  }

  public async sudoFillOpening(
    openingId: OpeningId,
    applicationIds: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.makeSudoCall(
      this.api.tx[module].fillOpening(openingId, this.api.createType('ApplicationIdSet', applicationIds), {
        'amount_per_payout': amountPerPayout,
        'next_payment_at_block': nextPaymentBlock,
        'payout_interval': payoutInterval,
      })
    )
  }

  public async increaseStake(
    worker: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].increaseStake(workerId, stake), worker)
  }

  public async decreaseStake(
    leader: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].decreaseStake(workerId, stake), leader)
  }

  public async slashStake(
    leader: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].slashStake(workerId, stake), leader)
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

  public async terminateApplication(
    leader: string,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].terminateApplication(applicationId), leader)
  }

  public async batchTerminateApplication(
    leader: string,
    applicationIds: ApplicationId[],
    module: WorkingGroups
  ): Promise<ISubmittableResult[]> {
    return Promise.all(applicationIds.map((id) => this.terminateApplication(leader, id, module)))
  }

  public async terminateRole(
    leader: string,
    workerId: WorkerId,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].terminateRole(workerId, text, false), leader)
  }

  public async leaveRole(
    account: string,
    workerId: WorkerId,
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx[module].leaveRole(workerId, text), account)
  }

  public async batchLeaveRole(
    workerIds: WorkerId[],
    text: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      workerIds.map(async (workerId) => {
        // get role_account of worker
        const worker = await this.getWorkerById(workerId, module)
        return this.leaveRole(worker.role_account_id.toString(), workerId, text, module)
      })
    )
  }

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

  public async getHiringOpening(id: OpeningId): Promise<HiringOpening> {
    return await this.api.query.hiring.openingById<HiringOpening>(id)
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
    const applicationsAndIds: [StorageKey, Application][] = await this.api.query[module].applicationById.entries<
      Application
    >()
    return applicationsAndIds
      .map((applicationWithId) => {
        const application: Application = applicationWithId[1]
        return application.role_account_id.toString() === address
          ? (applicationWithId[0].args[0] as ApplicationId)
          : undefined
      })
      .filter((id) => id !== undefined) as ApplicationId[]
  }

  public async getHiringApplicationById(id: ApplicationId): Promise<HiringApplication> {
    return this.api.query.hiring.applicationById<HiringApplication>(id)
  }

  public async getApplicationById(id: ApplicationId, module: WorkingGroups): Promise<Application> {
    return this.api.query[module].applicationById<Application>(id)
  }

  public async getApplicantRoleAccounts(filterActiveIds: ApplicationId[], module: WorkingGroups): Promise<string[]> {
    const entries: [StorageKey, Application][] = await this.api.query[module].applicationById.entries<Application>()

    const applications = entries
      .filter(([idKey]) => {
        return filterActiveIds.includes(idKey.args[0] as ApplicationId)
      })
      .map(([, application]) => application)

    return (
      await Promise.all(
        applications.map(async (application) => {
          const active = (await this.getHiringApplicationById(application.application_id)).stage.type === 'Active'
          return active ? application.role_account_id.toString() : ''
        })
      )
    ).filter((addr) => addr !== '')
  }

  public async getWorkerRoleAccounts(workerIds: WorkerId[], module: WorkingGroups): Promise<string[]> {
    const entries: [StorageKey, Worker][] = await this.api.query[module].workerById.entries<Worker>()

    return entries
      .filter(([idKey]) => {
        return workerIds.includes(idKey.args[0] as WorkerId)
      })
      .map(([, worker]) => worker.role_account_id.toString())
  }

  public async getStake(id: StakeId): Promise<Stake> {
    return this.api.query.stake.stakes<Stake>(id)
  }

  public async getWorkerStakeAmount(workerId: WorkerId, module: WorkingGroups): Promise<BN> {
    const stakeId: StakeId = (await this.getWorkerById(workerId, module)).role_stake_profile.unwrap().stake_id
    return (((await this.getStake(stakeId)).staking_status.value as unknown) as StakedState).staked_amount
  }

  public async getRewardRelationship(id: RewardRelationshipId): Promise<RewardRelationship> {
    return this.api.query.recurringRewards.rewardRelationships<RewardRelationship>(id)
  }

  public async getWorkerRewardRelationship(workerId: WorkerId, module: WorkingGroups): Promise<RewardRelationship> {
    const rewardRelationshipId: RewardRelationshipId = (
      await this.getWorkerById(workerId, module)
    ).reward_relationship.unwrap()
    return this.getRewardRelationship(rewardRelationshipId)
  }

  public async getWorkerRewardAccount(workerId: WorkerId, module: WorkingGroups): Promise<string> {
    const rewardRelationshipId: RewardRelationshipId = (
      await this.getWorkerById(workerId, module)
    ).reward_relationship.unwrap()
    return (await this.getRewardRelationship(rewardRelationshipId)).getField('account').toString()
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
