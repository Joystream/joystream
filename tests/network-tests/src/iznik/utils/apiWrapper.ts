import { ApiPromise, WsProvider } from '@polkadot/api'
import { Bytes, Option, u32, Vec } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { MemberId, PaidMembershipTerms, PaidTermId, UserInfo } from '@nicaea/types/members'
import { Mint, MintId } from '@nicaea/types/mint'
import { Lead, LeadId } from '@nicaea/types/content-working-group'
import {
  Application,
  ApplicationIdToWorkerIdMap,
  RewardPolicy,
  SlashingTerms,
  Worker,
  WorkerId,
  WorkingGroupOpeningPolicyCommitment,
} from '@nicaea/types/working-group'
import { ElectionStake, Seat } from '@nicaea/types/council'
import { AccountId, Balance, BalanceOf, BlockNumber, Event, EventRecord } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender } from './sender'
import { Utils } from './utils'
import { Stake, StakedState, StakeId } from '@nicaea/types/stake'
import { RewardRelationship, RewardRelationshipId } from '@nicaea/types/recurring-rewards'
import {
  ActivateOpeningAt,
  Application as HiringApplication,
  ApplicationId,
  ApplicationRationingPolicy,
  Opening as HiringOpening,
  OpeningId,
  StakingPolicy,
} from '@nicaea/types/hiring'
import { FillOpeningParameters, ProposalId } from '@nicaea/types/proposals'
import { WorkingGroup } from '@nicaea/types/common'

export enum WorkingGroups {
  StorageWorkingGroup = 'storageWorkingGroup',
}

export class ApiWrapper {
  private readonly api: ApiPromise
  private readonly sender: Sender

  public static async create(provider: WsProvider): Promise<ApiWrapper> {
    const api = await ApiPromise.create({ provider })
    return new ApiWrapper(api)
  }

  constructor(api: ApiPromise) {
    this.api = api
    this.sender = new Sender(api)
  }

  public close() {
    this.api.disconnect()
  }

  public getWorkingGroupString(workingGroup: WorkingGroups): string {
    switch (workingGroup) {
      case WorkingGroups.StorageWorkingGroup:
        return 'Storage'
      default:
        throw new Error(`Invalid working group string representation: ${workingGroup}`)
    }
  }

  public async buyMembership(
    account: KeyringPair,
    paidTermsId: PaidTermId,
    name: string,
    expectFailure = false
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx.members.buyMembership(
        paidTermsId,
        new UserInfo({ 'handle': name, 'avatar_uri': '', 'about': '' })
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      expectFailure
    )
  }

  public getMemberIds(address: string): Promise<MemberId[]> {
    return this.api.query.members.memberIdsByControllerAccountId<Vec<MemberId>>(address)
  }

  public getBalance(address: string): Promise<Balance> {
    return this.api.query.balances.freeBalance<Balance>(address)
  }

  public async transferBalance(from: KeyringPair, to: string, amount: BN): Promise<void> {
    return this.sender.signAndSend(this.api.tx.balances.transfer(to, amount), from)
  }

  public getPaidMembershipTerms(paidTermsId: PaidTermId): Promise<Option<PaidMembershipTerms>> {
    return this.api.query.members.paidMembershipTermsById<Option<PaidMembershipTerms>>(paidTermsId)
  }

  public getMembershipFee(paidTermsId: PaidTermId): Promise<BN> {
    return this.getPaidMembershipTerms(paidTermsId).then((terms) => terms.unwrap().fee)
  }

  public async transferBalanceToAccounts(from: KeyringPair, to: KeyringPair[], amount: BN): Promise<void[]> {
    return Promise.all(
      to.map(async (keyPair) => {
        await this.transferBalance(from, keyPair.address, amount)
      })
    )
  }

  private getBaseTxFee(): BN {
    return this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionBaseFee)
  }

  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): BN {
    const baseFee: BN = this.getBaseTxFee()
    const byteFee: BN = this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee)
    return Utils.calcTxLength(tx).mul(byteFee).add(baseFee)
  }

  public estimateBuyMembershipFee(account: KeyringPair, paidTermsId: PaidTermId, name: string): BN {
    return this.estimateTxFee(
      (this.api.tx.members.buyMembership(
        paidTermsId,
        new UserInfo({ 'handle': name, 'avatar_uri': '', 'about': '' })
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

  public estimateProposeContentWorkingGroupMintCapacityFee(
    title: string,
    description: string,
    stake: BN,
    balance: BN
  ): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetContentWorkingGroupMintCapacityProposal(
        stake,
        title,
        description,
        stake,
        balance
      )
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

  public estimateProposeEvictStorageProviderFee(title: string, description: string, stake: BN, address: string): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createEvictStorageProviderProposal(stake, title, description, stake, address)
    )
  }

  public estimateProposeStorageRoleParametersFee(
    title: string,
    description: string,
    stake: BN,
    minStake: BN,
    minActors: BN,
    maxActors: BN,
    reward: BN,
    rewardPeriod: BN,
    bondingPeriod: BN,
    unbondingPeriod: BN,
    minServicePeriod: BN,
    startupGracePeriod: BN,
    entryRequestFee: BN
  ): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetStorageRoleParametersProposal(stake, title, description, stake, [
        minStake,
        minActors,
        maxActors,
        reward,
        rewardPeriod,
        bondingPeriod,
        unbondingPeriod,
        minServicePeriod,
        startupGracePeriod,
        entryRequestFee,
      ])
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
        new MemberId(0),
        new ProposalId(0),
        'Approve'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateAddOpeningFee(module: WorkingGroups): BN {
    const commitment: WorkingGroupOpeningPolicyCommitment = new WorkingGroupOpeningPolicyCommitment({
      application_rationing_policy: new Option(ApplicationRationingPolicy, {
        max_active_applicants: new BN(32) as u32,
      }),
      max_review_period_length: new BN(32) as u32,
      application_staking_policy: new Option(StakingPolicy, {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_staking_policy: new Option(StakingPolicy, {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_slashing_terms: new SlashingTerms({
        Slashable: {
          max_count: new BN(0),
          max_percent_pts_per_time: new BN(0),
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
    })

    return this.estimateTxFee(
      this.api.tx[module].addOpening('CurrentBlock', commitment, 'Human readable text', 'Worker')
    )
  }

  public estimateAcceptApplicationsFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].acceptApplications(new OpeningId(0)) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateApplyOnOpeningFee(account: KeyringPair, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].applyOnOpening(
        new MemberId(0),
        new OpeningId(0),
        account.address,
        0,
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateBeginApplicantReviewFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].beginApplicantReview(new OpeningId(0)) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateFillOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].fillOpening(new OpeningId(0), [new ApplicationId(0)], {
        'amount_per_payout': 0,
        'next_payment_at_block': 0,
        'payout_interval': 0,
      }) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateIncreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].increaseStake(new WorkerId(0), 0) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateDecreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].decreaseStake(new WorkerId(0), 0) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateUpdateRoleAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].updateRoleAccount(new WorkerId(0), address) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateUpdateRewardAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].updateRewardAccount(new WorkerId(0), address) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateLeaveRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].leaveRole(new WorkerId(0), 'Long justification text') as unknown) as SubmittableExtrinsic<
        'promise'
      >
    )
  }

  public estimateWithdrawApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].withdrawApplication(new ApplicationId(0)) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateTerminateApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].terminateApplication(new ApplicationId(0)) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateSlashStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].slashStake(new WorkerId(0), 0) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateTerminateRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      (this.api.tx[module].terminateRole(
        new WorkerId(0),
        'Long justification text explaining why the worker role will be terminated',
        false
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeCreateWorkingGroupLeaderOpeningFee(): BN {
    const commitment: WorkingGroupOpeningPolicyCommitment = new WorkingGroupOpeningPolicyCommitment({
      application_rationing_policy: new Option(ApplicationRationingPolicy, {
        max_active_applicants: new BN(32) as u32,
      }),
      max_review_period_length: new BN(32) as u32,
      application_staking_policy: new Option(StakingPolicy, {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_staking_policy: new Option(StakingPolicy, {
        amount: new BN(1),
        amount_mode: 'AtLeast',
        crowded_out_unstaking_period_length: new BN(1),
        review_period_expired_unstaking_period_length: new BN(1),
      }),
      role_slashing_terms: new SlashingTerms({
        Slashable: {
          max_count: new BN(0),
          max_percent_pts_per_time: new BN(0),
        },
      }),
      fill_opening_successful_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      fill_opening_failed_applicant_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      terminate_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_application_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
      exit_role_stake_unstaking_period: new Option(u32, new BN(1) as BlockNumber),
    })

    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        new MemberId(0),
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
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        new OpeningId(0),
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeFillLeaderOpeningFee(): BN {
    const fillOpeningParameters: FillOpeningParameters = new FillOpeningParameters({
      opening_id: new OpeningId(0),
      successful_application_id: new ApplicationId(0),
      reward_policy: new Option(
        RewardPolicy,
        new RewardPolicy({
          amount_per_payout: new BN(1) as Balance,
          next_payment_at_block: new BN(99999) as BlockNumber,
          payout_interval: new Option(u32, new u32(99999)),
        })
      ),
      working_group: new WorkingGroup('Storage'),
    })

    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        new MemberId(0),
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
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        {
          'worker_id': new WorkerId(0),
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
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        new WorkerId(0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeDecreaseLeaderStakeFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        new WorkerId(0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeSlashLeaderStakeFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        new WorkerId(0),
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  public estimateProposeWorkingGroupMintCapacityFee(): BN {
    return this.estimateTxFee(
      (this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        new MemberId(0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        'Storage'
      ) as unknown) as SubmittableExtrinsic<'promise'>
    )
  }

  private applyForCouncilElection(account: KeyringPair, amount: BN): Promise<void> {
    return this.sender.signAndSend(this.api.tx.councilElection.apply(amount), account, false)
  }

  public batchApplyForCouncilElection(accounts: KeyringPair[], amount: BN): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair) => {
        await this.applyForCouncilElection(keyPair, amount)
      })
    )
  }

  public async getCouncilElectionStake(address: string): Promise<BN> {
    return (((await this.api.query.councilElection.applicantStakes(address)) as unknown) as ElectionStake).new
  }

  private voteForCouncilMember(account: KeyringPair, nominee: string, salt: string, stake: BN): Promise<void> {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.sender.signAndSend(this.api.tx.councilElection.vote(hashedVote, stake), account, false)
  }

  public batchVoteForCouncilMember(
    accounts: KeyringPair[],
    nominees: KeyringPair[],
    salt: string[],
    stake: BN
  ): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair, index) => {
        await this.voteForCouncilMember(keyPair, nominees[index].address, salt[index], stake)
      })
    )
  }

  private revealVote(account: KeyringPair, commitment: string, nominee: string, salt: string): Promise<void> {
    return this.sender.signAndSend(this.api.tx.councilElection.reveal(commitment, nominee, salt), account, false)
  }

  public batchRevealVote(accounts: KeyringPair[], nominees: KeyringPair[], salt: string[]): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair, index) => {
        const commitment = Utils.hashVote(nominees[index].address, salt[index])
        await this.revealVote(keyPair, commitment, nominees[index].address, salt[index])
      })
    )
  }

  // TODO consider using configurable genesis instead
  public sudoStartAnnouncingPerion(sudo: KeyringPair, endsAtBlock: BN): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.api.tx.councilElection.setStageAnnouncing(endsAtBlock)),
      sudo,
      false
    )
  }

  public sudoStartVotingPerion(sudo: KeyringPair, endsAtBlock: BN): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.api.tx.councilElection.setStageVoting(endsAtBlock)),
      sudo,
      false
    )
  }

  public sudoStartRevealingPerion(sudo: KeyringPair, endsAtBlock: BN): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.api.tx.councilElection.setStageRevealing(endsAtBlock)),
      sudo,
      false
    )
  }

  public sudoSetCouncilMintCapacity(sudo: KeyringPair, capacity: BN): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.api.tx.council.setCouncilMintCapacity(capacity)),
      sudo,
      false
    )
  }

  public getBestBlock(): Promise<BN> {
    return this.api.derive.chain.bestNumber()
  }

  public getCouncil(): Promise<Seat[]> {
    return this.api.query.council.activeCouncil<Vec<Codec>>().then((seats) => {
      return (seats as unknown) as Seat[]
    })
  }

  public getRuntime(): Promise<Bytes> {
    return this.api.query.substrate.code<Bytes>()
  }

  public async proposeRuntime(
    account: KeyringPair,
    stake: BN,
    name: string,
    description: string,
    runtime: Bytes | string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    stake: BN,
    name: string,
    description: string,
    text: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    balance: BN,
    destination: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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

  public async proposeContentWorkingGroupMintCapacity(
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    balance: BN
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      (this.api.tx.proposalsCodex.createSetContentWorkingGroupMintCapacityProposal(
        memberId,
        title,
        description,
        stake,
        balance
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async proposeValidatorCount(
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    validatorCount: BN
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    leadAccount: KeyringPair
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
    const leadMemberId: MemberId = (await this.getMemberIds(leadAccount.address))[0]
    const addressString: string = leadAccount.address
    return this.sender.signAndSend(
      (this.api.tx.proposalsCodex.createSetLeadProposal(memberId, title, description, stake, [
        leadMemberId,
        addressString,
      ]) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async proposeElectionParameters(
    account: KeyringPair,
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
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    openingId: OpeningId,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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

  public approveProposal(account: KeyringPair, memberId: MemberId, proposal: ProposalId): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx.proposalsEngine.vote(memberId, proposal, 'Approve') as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public batchApproveProposal(council: KeyringPair[], proposal: ProposalId): Promise<void[]> {
    return Promise.all(
      council.map(async (keyPair) => {
        const memberId: MemberId = (await this.getMemberIds(keyPair.address))[0]
        await this.approveProposal(keyPair, memberId, proposal)
      })
    )
  }

  public getBlockDuration(): BN {
    return this.api.createType('Moment', this.api.consts.babe.expectedBlockTime)
  }

  public expectProposalCreated(): Promise<ProposalId> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'ProposalCreated') {
            unsubscribe()
            resolve(record.event.data[1] as ProposalId)
          }
        })
      })
    })
  }

  public expectRuntimeUpgraded(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method.toString() === 'RuntimeUpdated') {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectProposalFinalized(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (
            record.event.method &&
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[1].toString().includes('Executed')
          ) {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectOpeningFilled(): Promise<ApplicationIdToWorkerIdMap> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'OpeningFilled') {
            unsubscribe()
            resolve((record.event.data[1] as unknown) as ApplicationIdToWorkerIdMap)
          }
        })
      })
    })
  }

  public expectEvent(eventName: string): Promise<Event> {
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

  public expectApplicationReviewBegan(): Promise<ApplicationId> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'BeganApplicationReview') {
            unsubscribe()
            resolve((record.event.data as unknown) as ApplicationId)
          }
        })
      })
    })
  }

  public async getContentWorkingGroupMintCapacity(): Promise<BN> {
    const mintId: MintId = await this.api.query.contentWorkingGroup.mint<MintId>()
    const mintCodec = await this.api.query.minting.mints<Codec[]>(mintId)
    const mint: Mint = (mintCodec[0] as unknown) as Mint
    return mint.getField<Balance>('capacity')
  }

  public async getWorkingGroupMintCapacity(module: WorkingGroups): Promise<BN> {
    const mintId: MintId = await this.api.query[module].mint<MintId>()
    const mintCodec = await this.api.query.minting.mints<Codec[]>(mintId)
    const mint: Mint = (mintCodec[0] as unknown) as Mint
    return mint.getField<Balance>('capacity')
  }

  public getValidatorCount(): Promise<BN> {
    return this.api.query.staking.validatorCount<u32>()
  }

  public async getCurrentLeadAddress(): Promise<string> {
    const leadId: Option<LeadId> = await this.api.query.contentWorkingGroup.currentLeadId<Option<LeadId>>()
    const leadCodec = await this.api.query.contentWorkingGroup.leadById<Codec[]>(leadId.unwrap())
    const lead = (leadCodec[0] as unknown) as Lead
    return lead.role_account.toString()
  }

  public async isStorageProvider(address: string): Promise<boolean> {
    const storageProviders: Vec<AccountId> = await this.api.query.actors.accountIdsByRole<Vec<AccountId>>(
      'StorageProvider'
    )
    const accountWorkers: WorkerId = await this.getWorkerIdByRoleAccount(address, WorkingGroups.StorageWorkingGroup)
    return accountWorkers !== undefined
  }

  public async addOpening(
    leader: KeyringPair,
    actiavteAt: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    text: string,
    type: string,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(
      this.createAddOpeningTransaction(actiavteAt, commitment, text, type, module),
      leader,
      expectFailure
    )
  }

  public async sudoAddOpening(
    sudo: KeyringPair,
    actiavteAt: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    text: string,
    type: string,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.createAddOpeningTransaction(actiavteAt, commitment, text, type, module)),
      sudo,
      false
    )
  }

  public async proposeCreateWorkingGroupLeaderOpening(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    actiavteAt: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    text: string,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      (this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        memberId,
        title,
        description,
        proposalStake,
        {
          activate_at: actiavteAt,
          commitment: commitment,
          human_readable_text: text,
          working_group: workingGroup,
        }
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async proposeFillLeaderOpening(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    fillOpeningParameters: FillOpeningParameters
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]

    return this.sender.signAndSend(
      (this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        memberId,
        title,
        description,
        proposalStake,
        fillOpeningParameters
      ) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async proposeTerminateLeaderRole(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    leadWorkerId: WorkerId,
    rationale: string,
    slash: boolean,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: WorkerId,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    mintCapacity: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    return this.api.tx[module].addOpening(actiavteAt, commitment, text, type)
  }

  public async acceptApplications(leader: KeyringPair, openingId: OpeningId, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].acceptApplications(openingId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async beginApplicantReview(leader: KeyringPair, openingId: OpeningId, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].beginApplicantReview(openingId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async sudoBeginApplicantReview(sudo: KeyringPair, openingId: OpeningId, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx.sudo.sudo(this.api.tx[module].beginApplicantReview(openingId)) as unknown) as SubmittableExtrinsic<
        'promise'
      >,
      sudo,
      false
    )
  }

  public async applyOnOpening(
    account: KeyringPair,
    roleAccountAddress: string,
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void> {
    const memberId: MemberId = (await this.getMemberIds(account.address))[0]
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
    accounts: KeyringPair[],
    openingId: OpeningId,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair) => {
        await this.applyOnOpening(
          keyPair,
          keyPair.address,
          openingId,
          roleStake,
          applicantStake,
          text,
          expectFailure,
          module
        )
      })
    )
  }

  public async fillOpening(
    leader: KeyringPair,
    openingId: OpeningId,
    applicationId: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<void> {
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
    sudo: KeyringPair,
    openingId: OpeningId,
    applicationId: ApplicationId[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(
        this.api.tx[module].fillOpening(openingId, applicationId, {
          'amount_per_payout': amountPerPayout,
          'next_payment_at_block': nextPaymentBlock,
          'payout_interval': payoutInterval,
        })
      ),
      sudo,
      false
    )
  }

  public async increaseStake(worker: KeyringPair, workerId: WorkerId, stake: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].increaseStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      worker,
      false
    )
  }

  public async decreaseStake(
    leader: KeyringPair,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].decreaseStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async slashStake(
    leader: KeyringPair,
    workerId: WorkerId,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].slashStake(workerId, stake) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async updateRoleAccount(
    worker: KeyringPair,
    workerId: WorkerId,
    newRoleAccount: string,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].updateRoleAccount(workerId, newRoleAccount) as unknown) as SubmittableExtrinsic<'promise'>,
      worker,
      false
    )
  }

  public async updateRewardAccount(
    worker: KeyringPair,
    workerId: WorkerId,
    newRewardAccount: string,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].updateRewardAccount(workerId, newRewardAccount) as unknown) as SubmittableExtrinsic<
        'promise'
      >,
      worker,
      false
    )
  }

  public async withdrawApplication(
    account: KeyringPair,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].withdrawApplication(applicationId) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      false
    )
  }

  public async batchWithdrawApplication(accounts: KeyringPair[], module: WorkingGroups): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair) => {
        const applicationIds: ApplicationId[] = await this.getApplicationsIdsByRoleAccount(keyPair.address, module)
        await this.withdrawApplication(keyPair, applicationIds[0], module)
      })
    )
  }

  public async terminateApplication(
    leader: KeyringPair,
    applicationId: ApplicationId,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].terminateApplication(applicationId) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      false
    )
  }

  public async batchTerminateApplication(
    leader: KeyringPair,
    roleAccounts: KeyringPair[],
    module: WorkingGroups
  ): Promise<void[]> {
    return Promise.all(
      roleAccounts.map(async (keyPair) => {
        const applicationIds: ApplicationId[] = await this.getActiveApplicationsIdsByRoleAccount(
          keyPair.address,
          module
        )
        await this.terminateApplication(leader, applicationIds[0], module)
      })
    )
  }

  public async terminateRole(
    leader: KeyringPair,
    applicationId: ApplicationId,
    text: string,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(
      (this.api.tx[module].terminateRole(applicationId, text, false) as unknown) as SubmittableExtrinsic<'promise'>,
      leader,
      expectFailure
    )
  }

  public async leaveRole(
    account: KeyringPair,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void> {
    const workerId: WorkerId = await this.getWorkerIdByRoleAccount(account.address, module)
    return this.sender.signAndSend(
      (this.api.tx[module].leaveRole(workerId, text) as unknown) as SubmittableExtrinsic<'promise'>,
      account,
      expectFailure
    )
  }

  public async batchLeaveRole(
    roleAccounts: KeyringPair[],
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void[]> {
    return Promise.all(
      roleAccounts.map(async (keyPair) => {
        await this.leaveRole(keyPair, text, expectFailure, module)
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
    return ((await this.api.query.hiring.openingById<Codec[]>(id))[0] as unknown) as HiringOpening
  }

  public async getWorkers(module: WorkingGroups): Promise<Worker[]> {
    return ((await this.api.query[module].workerById<Codec[]>())[1] as unknown) as Worker[]
  }

  public async getWorkerById(id: WorkerId, module: WorkingGroups): Promise<Worker> {
    return ((await this.api.query[module].workerById<Codec[]>(id))[0] as unknown) as Worker
  }

  public async getWorkerIdByRoleAccount(address: string, module: WorkingGroups): Promise<WorkerId> {
    const workersAndIds = await this.api.query[module].workerById<Codec[]>()
    const workers: Worker[] = (workersAndIds[1] as unknown) as Worker[]
    const ids: WorkerId[] = (workersAndIds[0] as unknown) as WorkerId[]
    const index: number = workers.findIndex((worker) => worker.role_account_id.toString() === address)
    return ids[index]
  }

  public async getApplicationsIdsByRoleAccount(address: string, module: WorkingGroups): Promise<ApplicationId[]> {
    const applicationsAndIds = await this.api.query[module].applicationById<Codec[]>()
    const applications: Application[] = (applicationsAndIds[1] as unknown) as Application[]
    const ids: ApplicationId[] = (applicationsAndIds[0] as unknown) as ApplicationId[]
    return applications
      .map((application, index) => (application.role_account_id.toString() === address ? ids[index] : undefined))
      .filter((id) => id !== undefined) as ApplicationId[]
  }

  public async getHiringApplicationById(id: ApplicationId): Promise<HiringApplication> {
    return ((await this.api.query.hiring.applicationById<Codec[]>(id))[0] as unknown) as HiringApplication
  }

  public async getApplicationById(id: ApplicationId, module: WorkingGroups): Promise<Application> {
    return ((await this.api.query[module].applicationById<Codec[]>(id))[0] as unknown) as Application
  }

  public async getActiveApplicationsIdsByRoleAccount(address: string, module: WorkingGroups): Promise<ApplicationId[]> {
    const applicationsAndIds = await this.api.query[module].applicationById<Codec[]>()
    const applications: Application[] = (applicationsAndIds[1] as unknown) as Application[]
    const ids: ApplicationId[] = (applicationsAndIds[0] as unknown) as ApplicationId[]
    return (
      await Promise.all(
        applications.map(async (application, index) => {
          if (
            application.role_account_id.toString() === address &&
            (await this.getHiringApplicationById(application.application_id)).stage.type === 'Active'
          ) {
            return ids[index]
          } else {
            return undefined
          }
        })
      )
    ).filter((index) => index !== undefined) as ApplicationId[]
  }

  public async getStake(id: StakeId): Promise<Stake> {
    return ((await this.api.query.stake.stakes<Codec[]>(id))[0] as unknown) as Stake
  }

  public async getWorkerStakeAmount(workerId: WorkerId, module: WorkingGroups): Promise<BN> {
    const stakeId: StakeId = (await this.getWorkerById(workerId, module)).role_stake_profile.unwrap().stake_id
    return (((await this.getStake(stakeId)).staking_status.value as unknown) as StakedState).staked_amount
  }

  public async getRewardRelationship(id: RewardRelationshipId): Promise<RewardRelationship> {
    return ((
      await this.api.query.recurringRewards.rewardRelationships<Codec[]>(id)
    )[0] as unknown) as RewardRelationship
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
}
