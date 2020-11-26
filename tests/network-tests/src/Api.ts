import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { Bytes, Option, u32, Vec, StorageKey } from '@polkadot/types'
import { Codec, ISubmittableResult } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { MemberId, PaidMembershipTerms, PaidTermId } from '@joystream/types/members'
import { Mint, MintId } from '@joystream/types/mint'
import {
  Application,
  ApplicationIdToWorkerIdMap,
  Worker,
  WorkerId,
  WorkingGroupOpeningPolicyCommitment,
  Opening as WorkingGroupOpening,
} from '@joystream/types/working-group'
import { ElectionStake, Seat } from '@joystream/types/council'
import { AccountInfo, Hash, Balance, BalanceOf, BlockNumber, Event, EventRecord } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender } from './sender'
import { Utils } from './utils'
import { Stake, StakedState, StakeId } from '@joystream/types/stake'
import { RewardRelationship, RewardRelationshipId } from '@joystream/types/recurring-rewards'
import { types } from '@joystream/types'
import {
  ActivateOpeningAt,
  Application as HiringApplication,
  ApplicationId,
  Opening as HiringOpening,
  OpeningId,
} from '@joystream/types/hiring'
import { FillOpeningParameters, ProposalId } from '@joystream/types/proposals'
import { v4 as uuid } from 'uuid'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { initializeContentDir, InputParser, ExtrinsicsHelper } from '@joystream/cd-schemas'
import { OperationType } from '@joystream/types/content-directory'
import { gql, ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client'

import Debugger from 'debug'
const debug = Debugger('api')

export enum WorkingGroups {
  StorageWorkingGroup = 'storageWorkingGroup',
  ContentDirectoryWorkingGroup = 'contentDirectoryWorkingGroup',
}

export class Api {
  protected readonly api: ApiPromise
  protected readonly sender: Sender
  protected readonly keyring: Keyring
  // source of funds for all new accounts
  protected readonly treasuryAccount: string

  public static async create(provider: WsProvider, treasuryAccountUri: string, sudoAccountUri: string): Promise<Api> {
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

        return new Api(api, treasuryAccountUri, sudoAccountUri)
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
    const treasuryKey = this.keyring.addFromUri(treasuryAccountUri)
    this.treasuryAccount = treasuryKey.address
    this.keyring.addFromUri(sudoAccountUri)
    this.sender = new Sender(api, this.keyring)
  }

  public close() {
    this.api.disconnect()
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
      default:
        throw new Error(`Invalid working group string representation: ${workingGroup}`)
    }
  }

  public async makeSudoCall(tx: SubmittableExtrinsic<'promise'>, expectFailure = false): Promise<ISubmittableResult> {
    const sudo = await this.api.query.sudo.key()
    return this.sender.signAndSend(this.api.tx.sudo.sudo(tx), sudo, expectFailure)
  }

  public createPaidTermId(value: BN): PaidTermId {
    return this.api.createType('PaidTermId', value)
  }

  public async buyMembership(
    account: string,
    paidTermsId: PaidTermId,
    name: string,
    expectFailure = false
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx.members.buyMembership(
        paidTermsId,
        /* Handle: */ name,
        /* Avatar uri: */ '',
        /* About: */ ''
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      expectFailure
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

  public treasuryTransferBalanceToAccounts(to: string[], amount: BN): void {
    to.map((account) => this.transferBalance(this.treasuryAccount, account, amount))
  }

  public getPaidMembershipTerms(paidTermsId: PaidTermId): Promise<PaidMembershipTerms> {
    return this.api.query.members.paidMembershipTermsById<PaidMembershipTerms>(paidTermsId)
  }

  public async getMembershipFee(paidTermsId: PaidTermId): Promise<BN> {
    const terms: PaidMembershipTerms = await this.getPaidMembershipTerms(paidTermsId)
    return terms.fee
  }

  private getBaseTxFee(): BN {
    return this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionBaseFee)
  }

  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): BN {
    const baseFee: BN = this.getBaseTxFee()
    const byteFee: BN = this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee)
    return Utils.calcTxLength(tx).mul(byteFee).add(baseFee)
  }

  public estimateBuyMembershipFee(account: string, paidTermsId: PaidTermId, name: string): BN {
    return this.estimateTxFee(
      (this.api.tx.members.buyMembership(
        paidTermsId,
        /* Handle: */ name,
        /* Avatar uri: */ '',
        /* About: */ ''
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateApplyForCouncilFee(amount: BN): BN {
    return this.estimateTxFee(this.api.tx.councilElection.apply(amount))
  }

  public estimateVoteForCouncilFee(nominee: string, salt: string, stake: BN): BN {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.estimateTxFee(this.api.tx.councilElection.vote(hashedVote, stake))
  }

  public estimateRevealVoteFee(nominee: string, salt: string): BN {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.estimateTxFee(this.api.tx.councilElection.reveal(hashedVote, nominee, salt))
  }

  public estimateProposeRuntimeUpgradeFee(stake: BN, name: string, description: string, runtime: Bytes | string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createRuntimeUpgradeProposal(stake, name, description, stake, runtime)
    )
  }

  public estimateProposeTextFee(stake: BN, name: string, description: string, text: string): BN {
    return this.estimateTxFee(this.api.tx.proposalsCodex.createTextProposal(stake, name, description, stake, text))
  }

  public estimateProposeSpendingFee(
    title: string,
    description: string,
    stake: BN,
    balance: BN,
    destination: string
  ): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSpendingProposal(stake, title, description, stake, balance, destination)
    )
  }

  public estimateProposeValidatorCountFee(title: string, description: string, stake: BN): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetValidatorCountProposal(stake, title, description, stake, stake)
    )
  }

  public estimateProposeLeadFee(title: string, description: string, stake: BN, address: string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetLeadProposal(stake, title, description, stake, { stake, address })
    )
  }

  public estimateProposeElectionParametersFee(
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
  ): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetElectionParametersProposal(stake, title, description, stake, [
        announcingPeriod,
        votingPeriod,
        revealingPeriod,
        councilSize,
        candidacyLimit,
        newTermDuration,
        minCouncilStake,
        minVotingStake,
      ])
    )
  }

  public estimateVoteForProposalFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsEngine.vote(
        this.api.createType('MemberId', 0),
        this.api.createType('ProposalId', 0),
        'Approve'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateAddOpeningFee(module: WorkingGroups): BN {
    const commitment: WorkingGroupOpeningPolicyCommitment = this.api.createType('WorkingGroupOpeningPolicyCommitment', {
      application_rationing_policy: this.api.createType('Option<ApplicationRationingPolicy>', {
        max_active_applicants: new BN(32) as u32,
      }),
      max_review_period_length: new BN(32) as u32,
      application_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_slashing_terms: this.api.createType('SlashingTerms', {
        Slashable: {
          max_count: new BN(0),
          max_percent_pts_per_time: new BN(0),
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        new BN(1)
      ),
      fill_opening_failed_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        new BN(1)
      ),
      fill_opening_failed_applicant_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      terminate_application_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      terminate_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      exit_role_application_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      exit_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
    })

    return this.estimateTxFee(
      (this.api.tx[module].addOpening(
        'CurrentBlock',
        commitment,
        'Human readable text',
        'Worker'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateAcceptApplicationsFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].acceptApplications(this.api.createType('OpeningId', 0)) as unknown) as SubmittableExtrinsic<
        'promise'
      >
    )
  }

  public estimateApplyOnOpeningFee(account: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].applyOnOpening(
        this.api.createType('MemberId', 0),
        this.api.createType('OpeningId', 0),
        account,
        0,
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateBeginApplicantReviewFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].beginApplicantReview(
        this.api.createType('OpeningId', 0)
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateFillOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].fillOpening(this.api.createType('OpeningId', 0), [this.api.createType('ApplicationId', 0)], {
        'amount_per_payout': 0,
        'next_payment_at_block': 0,
        'payout_interval': 0,
      }) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateIncreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].increaseStake(this.api.createType('WorkerId', 0), 0) as unknown) as SubmittableExtrinsic<
        'promise'
      >
    )
  }

  public estimateDecreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].decreaseStake(this.api.createType('WorkerId', 0), 0) as unknown) as SubmittableExtrinsic<
        'promise'
      >
    )
  }

  public estimateUpdateRoleAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].updateRoleAccount(
        this.api.createType('WorkerId', 0),
        address
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateUpdateRewardAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].updateRewardAccount(
        this.api.createType('WorkerId', 0),
        address
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateLeaveRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].leaveRole(
        this.api.createType('WorkerId', 0),
        'Long justification text'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateWithdrawApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].withdrawApplication(
        this.api.createType('ApplicationId', 0)
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateTerminateApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].terminateApplication(
        this.api.createType('ApplicationId', 0)
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateSlashStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].slashStake(this.api.createType('WorkerId', 0), 0) as unknown) as SubmittableExtrinsic<
        'promise'
      >
    )
  }

  public estimateTerminateRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].terminateRole(
        this.api.createType('WorkerId', 0),
        'Long justification text explaining why the worker role will be terminated',
        false
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeCreateWorkingGroupLeaderOpeningFee(): BN {
    const commitment: WorkingGroupOpeningPolicyCommitment = this.api.createType('WorkingGroupOpeningPolicyCommitment', {
      application_rationing_policy: this.api.createType('Option<ApplicationRationingPolicy>', {
        max_active_applicants: new BN(32) as u32,
      }),
      max_review_period_length: new BN(32) as u32,
      application_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_staking_policy: this.api.createType('Option<StakingPolicy>', {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_slashing_terms: this.api.createType('SlashingTerms', {
        Slashable: {
          max_count: new BN(0),
          max_percent_pts_per_time: new BN(0),
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        new BN(1)
      ),
      fill_opening_failed_applicant_application_stake_unstaking_period: this.api.createType(
        'Option<BlockNumber>',
        new BN(1)
      ),
      fill_opening_failed_applicant_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      terminate_application_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      terminate_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      exit_role_application_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
      exit_role_stake_unstaking_period: this.api.createType('Option<BlockNumber>', new BN(1)),
    })

    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        this.api.createType('MemberId', 0),
        'some long title for the purpose of testing',
        'some long description for the purpose of testing',
        0,
        {
          'activate_at': 'CurrentBlock',
          'commitment': commitment,
          'human_readable_text': 'Opening readable text',
          'working_group': 'Storage',
        }
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeBeginWorkingGroupLeaderApplicationReviewFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        this.api.createType('OpeningId', 0),
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeFillLeaderOpeningFee(): BN {
    const fillOpeningParameters: FillOpeningParameters = this.api.createType('FillOpeningParameters', {
      opening_id: this.api.createType('OpeningId', 0),
      successful_application_id: this.api.createType('ApplicationId', 0),
      reward_policy: this.api.createType('Option<RewardPolicy>', {
        amount_per_payout: new BN(1) as Balance,
        next_payment_at_block: new BN(99999) as BlockNumber,
        payout_interval: this.api.createType('Option<u32>', new BN(99999)),
      }),
      working_group: this.api.createType('WorkingGroup', 'Storage'),
    })

    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        fillOpeningParameters
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeTerminateLeaderRoleFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createTerminateWorkingGroupLeaderRoleProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        {
          'worker_id': this.api.createType('WorkerId', 0),
          'rationale': 'Exceptionaly long and extraordinary descriptive rationale',
          'slash': true,
          'working_group': 'Storage',
        }
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeLeaderRewardFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createSetWorkingGroupLeaderRewardProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeDecreaseLeaderStakeFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeSlashLeaderStakeFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeWorkingGroupMintCapacityFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  private applyForCouncilElection(account: string, amount: BN): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.councilElection.apply(amount), account, false)
  }

  public batchApplyForCouncilElection(accounts: string[], amount: BN): Promise<void[]> {
    return Promise.all(
      accounts.map(async (account) => {
        await this.applyForCouncilElection(account, amount)
      })
    )
  }

  public async getCouncilElectionStake(address: string): Promise<BN> {
    return (((await this.api.query.councilElection.applicantStakes(address)) as unknown) as ElectionStake).new
  }

  private voteForCouncilMember(account: string, nominee: string, salt: string, stake: BN): Promise<ISubmittableResult> {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.sender.signAndSend(this.api.tx.councilElection.vote(hashedVote, stake), account, false)
  }

  public batchVoteForCouncilMember(accounts: string[], nominees: string[], salt: string[], stake: BN): Promise<void[]> {
    return Promise.all(
      accounts.map(async (account, index) => {
        await this.voteForCouncilMember(account, nominees[index], salt[index], stake)
      })
    )
  }

  private revealVote(account: string, commitment: string, nominee: string, salt: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.councilElection.reveal(commitment, nominee, salt), account, false)
  }

  public batchRevealVote(accounts: string[], nominees: string[], salt: string[]): Promise<void[]> {
    return Promise.all(
      accounts.map(async (account, index) => {
        const commitment = Utils.hashVote(nominees[index], salt[index])
        await this.revealVote(account, commitment, nominees[index], salt[index])
      })
    )
  }

  public sudoStartAnnouncingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageAnnouncing(endsAtBlock), false)
  }

  public sudoStartVotingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageVoting(endsAtBlock), false)
  }

  public sudoStartRevealingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageRevealing(endsAtBlock), false)
  }

  public sudoSetCouncilMintCapacity(capacity: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.council.setCouncilMintCapacity(capacity), false)
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

  public getRuntime(): Promise<Bytes> {
    return this.api.query.substrate.code<Bytes>()
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
      (this.api.tx.proposalsCodex.createRuntimeUpgradeProposal(
        memberId,
        name,
        description,
        stake,
        runtime
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createTextProposal(
        memberId,
        name,
        description,
        stake,
        text
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSpendingProposal(
        memberId,
        title,
        description,
        stake,
        balance,
        destination
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSetValidatorCountProposal(
        memberId,
        title,
        description,
        stake,
        validatorCount
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async proposeLead(
    account: string,
    title: string,
    description: string,
    stake: BN,
    leadAccount: string
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    const leadMemberId: MemberId = (await this.getMemberIds(leadAccount))[0]
    return this.sender.signAndSend(
      (this.api.tx.proposalsCodex.createSetLeadProposal(memberId, title, description, stake, [
        leadMemberId,
        leadAccount,
      ]) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSetElectionParametersProposal(memberId, title, description, stake, [
        announcingPeriod,
        votingPeriod,
        revealingPeriod,
        councilSize,
        candidacyLimit,
        newTermDuration,
        minCouncilStake,
        minVotingStake,
      ]) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        memberId,
        title,
        description,
        stake,
        openingId,
        workingGroup
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public approveProposal(account: string, memberId: MemberId, proposal: ProposalId): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx.proposalsEngine.vote(memberId, proposal, 'Approve') as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async batchApproveProposal(proposal: ProposalId): Promise<void[]> {
    const councilAccounts = await this.getCouncilAccounts()
    return Promise.all(
      councilAccounts.map(async (account) => {
        const memberId: MemberId = (await this.getMemberIds(account))[0]
        await this.approveProposal(account, memberId, proposal)
      })
    )
  }

  public getBlockDuration(): BN {
    return this.api.createType('Moment', this.api.consts.babe.expectedBlockTime)
  }

  public durationInMsFromBlocks(durationInBlocks: number) {
    return this.getBlockDuration().muln(durationInBlocks).toNumber()
  }

  public expectMemberRegisteredEvent(events: EventRecord[]): MemberId {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'MemberRegistered')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return record.event.data[0] as MemberId
  }

  public expectProposalCreatedEvent(events: EventRecord[]): ProposalId {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'ProposalCreated')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return record.event.data[1] as ProposalId
  }

  public expectOpeningAddedEvent(events: EventRecord[]): OpeningId {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'OpeningAdded')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return record.event.data[0] as OpeningId
  }

  public expectLeaderSetEvent(events: EventRecord[]): WorkerId {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'LeaderSet')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data as unknown) as WorkerId
  }

  public expectBeganApplicationReviewEvent(events: EventRecord[]): ApplicationId {
    const record = events.find(
      (record) => record.event.method && record.event.method.toString() === 'BeganApplicationReview'
    )
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data as unknown) as ApplicationId
  }

  public expectTerminatedLeaderEvent(events: EventRecord[]): void {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'TerminatedLeader')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
  }

  public expectWorkerRewardAmountUpdatedEvent(events: EventRecord[]): WorkerId {
    const record = events.find(
      (record) => record.event.method && record.event.method.toString() === 'WorkerRewardAmountUpdated'
    )
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data[0] as unknown) as WorkerId
  }

  public expectStakeDecreasedEvent(events: EventRecord[]): void {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'StakeDecreased')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
  }

  public expectStakeSlashedEvent(events: EventRecord[]): void {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'StakeSlashed')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
  }

  public expectMintCapacityChangedEvent(events: EventRecord[]): BN {
    const record = events.find(
      (record) => record.event.method && record.event.method.toString() === 'MintCapacityChanged'
    )
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data[1] as unknown) as BN
  }

  public async expectRuntimeUpgraded(): Promise<void> {
    await this.expectSystemEvent('RuntimeUpdated')
  }

  // Resolves with events that were emitted at the same time that the proposal
  // was finalized (I think!)
  public waitForProposalToFinalize(id: ProposalId): Promise<EventRecord[]> {
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
            resolve(events)
          } else if (
            record.event.method &&
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[0].eq(id) &&
            record.event.data[1].toString().includes('ExecutionFailed')
          ) {
            unsubscribe()
            resolve(events)
          }
        })
      })
    })
  }

  public expectOpeningFilledEvent(events: EventRecord[]): ApplicationIdToWorkerIdMap {
    const record = events.find((record) => record.event.method && record.event.method.toString() === 'OpeningFilled')
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data[1] as unknown) as ApplicationIdToWorkerIdMap
  }

  // Looks for the first occurance of an expected event, and resolves.
  // Use this when the event we are expecting is not particular to a specific extrinsic
  public expectSystemEvent(eventName: string): Promise<Event> {
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

  public expectApplicationReviewBeganEvent(events: EventRecord[]): ApplicationId {
    const record = events.find(
      (record) => record.event.method && record.event.method.toString() === 'BeganApplicationReview'
    )
    if (!record) {
      throw new Error('Expected Event Not Found')
    }
    return (record.event.data as unknown) as ApplicationId
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
    module: WorkingGroups,
    expectFailure: boolean
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
      lead,
      expectFailure
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
      this.createAddOpeningTransaction(activateAt, commitment, openingParameters.text, openingParameters.type, module),
      false
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
      (this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
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
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      leaderOpening.account,
      false
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
      (this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        memberId,
        fillOpening.title,
        fillOpening.description,
        fillOpening.proposalStake,
        fillOpeningParameters
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      fillOpening.account,
      false
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
      (this.api.tx.proposalsCodex.createTerminateWorkingGroupLeaderRoleProposal(
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
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSetWorkingGroupLeaderRewardProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
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
      (this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        memberId,
        title,
        description,
        proposalStake,
        mintCapacity,
        workingGroup
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  private createAddOpeningTransaction(
    actiavteAt: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    text: string,
    type: string,
    module: WorkingGroups
  ): SubmittableExtrinsic<'promise'> {
    return (this.api.tx[module].addOpening(actiavteAt, commitment, text, type) as unknown) as SubmittableExtrinsic<
      'promise'
    >
  }

  public async acceptApplications(
    leader: string,
    openingId: OpeningId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].acceptApplications(openingId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async beginApplicantReview(
    leader: string,
    openingId: OpeningId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].beginApplicantReview(openingId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async sudoBeginApplicantReview(openingId: OpeningId, module: WorkingGroups): Promise<ISubmittableResult> {
    return this.makeSudoCall(
      (this.api.tx[module].beginApplicantReview(openingId) as unknown) as SubmittableExtrinsic<'promise'>,
      false
    )
  }

  public async applyOnOpening(
    account: string,
    roleAccountAddress: string,
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    const memberId: MemberId = (await this.getMemberIds(account))[0]
    return this.sender.signAndSend(
      (this.api.tx[module].applyOnOpening(
        memberId,
        openingId,
        roleAccountAddress,
        roleStake,
        applicantStake,
        text
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      expectFailure
    )
  }

  public async batchApplyOnOpening(
    accounts: string[],
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account) =>
        this.applyOnOpening(account, account, openingId, roleStake, applicantStake, text, expectFailure, module)
      )
    )
  }

  public async fillOpening(
    leader: string,
    openingId: OpeningId,
    applicationId: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].fillOpening(openingId, applicationId, {
        'amount_per_payout': amountPerPayout,
        'next_payment_at_block': nextPaymentBlock,
        'payout_interval': payoutInterval,
      }) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async sudoFillOpening(
    openingId: OpeningId,
    applicationId: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.makeSudoCall(
      this.api.tx[module].fillOpening(openingId, applicationId, {
        'amount_per_payout': amountPerPayout,
        'next_payment_at_block': nextPaymentBlock,
        'payout_interval': payoutInterval,
      }),
      false
    )
  }

  public async increaseStake(
    worker: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].increaseStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      worker,
      false
    )
  }

  public async decreaseStake(
    leader: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].decreaseStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async slashStake(
    leader: string,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].slashStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async updateRoleAccount(
    worker: string,
    workerId: WorkerId,
    newRoleAccount: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].updateRoleAccount(workerId, newRoleAccount) as unknown) as SubmittableExtrinsic<'promise'>,
      worker,
      false
    )
  }

  public async updateRewardAccount(
    worker: string,
    workerId: WorkerId,
    newRewardAccount: string,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].updateRewardAccount(workerId, newRewardAccount) as unknown) as SubmittableExtrinsic<
        'promise'
      >,
      worker,
      false
    )
  }

  public async withdrawApplication(
    account: string,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].withdrawApplication(applicationId) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
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

  /*
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
  */

  public async terminateApplication(
    leader: string,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].terminateApplication(applicationId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
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
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].terminateRole(workerId, text, false) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async leaveRole(
    account: string,
    workerId: WorkerId,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      (this.api.tx[module].leaveRole(workerId, text) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      expectFailure
    )
  }

  public async batchLeaveRole(
    workerIds: WorkerId[],
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void[]> {
    return Promise.all(
      workerIds.map(async (workerId) => {
        // get role_account of worker
        const worker = await this.getWorkerById(workerId, module)
        await this.leaveRole(worker.role_account_id.toString(), workerId, text, expectFailure, module)
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

  async sendContentDirectoryTransaction(operations: OperationType[]): Promise<void> {
    const transaction = this.api.tx.contentDirectory.transaction(
      { Lead: null }, // We use member with id 0 as actor (in this case we assume this is Alice)
      operations // We provide parsed operations as second argument
    )
    const lead = (await this.getGroupLead(WorkingGroups.ContentDirectoryWorkingGroup)) as Worker
    await this.sender.signAndSend(transaction, lead.role_account_id, false)
  }

  public async createChannelEntity(channel: ChannelEntity): Promise<void> {
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
    return await this.sendContentDirectoryTransaction(operations)
  }

  public async createVideoEntity(video: VideoEntity): Promise<void> {
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
    return await this.sendContentDirectoryTransaction(operations)
  }

  public async updateChannelEntity(
    channelUpdateInput: Record<string, any>,
    uniquePropValue: Record<string, any>
  ): Promise<void> {
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
    return await this.sendContentDirectoryTransaction(updateOperations)
  }

  public async initializeContentDirectory(leadKeyPair: KeyringPair) {
    await initializeContentDir(this.api, leadKeyPair)
  }
}

export class QueryNodeApi extends Api {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>

  public static async new(
    provider: WsProvider,
    queryNodeProvider: ApolloClient<NormalizedCacheObject>,
    treasuryAccountUri: string,
    sudoAccountUri: string
  ): Promise<QueryNodeApi> {
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

        return new QueryNodeApi(api, queryNodeProvider, treasuryAccountUri, sudoAccountUri)
      } catch (err) {
        if (connectAttempts === 3) {
          throw new Error('Unable to connect to chain')
        }
      }
      await Utils.wait(5000)
    }
  }

  constructor(
    api: ApiPromise,
    queryNodeProvider: ApolloClient<NormalizedCacheObject>,
    treasuryAccountUri: string,
    sudoAccountUri: string
  ) {
    super(api, treasuryAccountUri, sudoAccountUri)
    this.queryNodeProvider = queryNodeProvider
  }

  public async getChannelbyTitle(title: string): Promise<ApolloQueryResult<any>> {
    const GET_CHANNEL_BY_TITLE = gql`
      query($title: String!) {
        channels(where: { title_eq: $title }) {
          title
          description
          coverPhotoUrl
          avatarPhotoUrl
          isPublic
          isCurated
          languageId
        }
      }
    `

    return await this.queryNodeProvider.query({ query: GET_CHANNEL_BY_TITLE, variables: { title } })
  }
}
