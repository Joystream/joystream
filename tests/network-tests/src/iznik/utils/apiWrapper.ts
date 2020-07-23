import { ApiPromise, WsProvider } from '@polkadot/api'
import { Option, Vec, Bytes, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { UserInfo, PaidMembershipTerms, MemberId } from '@nicaea/types/members'
import { Mint, MintId } from '@nicaea/types/mint'
import { Lead, LeadId } from '@nicaea/types/content-working-group'
import { Application, WorkerId, Worker, ApplicationIdToWorkerIdMap, Opening } from '@nicaea/types/working-group'
import { RoleParameters } from '@nicaea/types/roles'
import { Seat } from '@nicaea/types/council'
import { Balance, EventRecord, AccountId, BlockNumber, BalanceOf } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender } from './sender'
import { Utils } from './utils'
import { Stake, StakedState } from '@nicaea/types/stake'
import { RewardRelationship } from '@nicaea/types/recurring-rewards'
import { Opening as HiringOpening, Application as HiringApplication, ApplicationId } from '@nicaea/types/hiring'
import { WorkingGroupOpening } from '../dto/workingGroupOpening'
import { FillOpeningParameters } from '../dto/fillOpeningParameters'

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
    paidTermsId: number,
    name: string,
    expectFailure = false
  ): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.members.buyMembership(paidTermsId, new UserInfo({ 'handle': name, 'avatar_uri': '', 'about': '' })),
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

  public getPaidMembershipTerms(paidTermsId: number): Promise<Option<PaidMembershipTerms>> {
    return this.api.query.members.paidMembershipTermsById<Option<PaidMembershipTerms>>(paidTermsId)
  }

  public getMembershipFee(paidTermsId: number): Promise<BN> {
    return this.getPaidMembershipTerms(paidTermsId).then((terms) => terms.unwrap().fee.toBn())
  }

  public async transferBalanceToAccounts(from: KeyringPair, to: KeyringPair[], amount: BN): Promise<void[]> {
    return Promise.all(
      to.map(async (keyPair) => {
        await this.transferBalance(from, keyPair.address, amount)
      })
    )
  }

  private getBaseTxFee(): BN {
    return this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionBaseFee).toBn()
  }

  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): BN {
    const baseFee: BN = this.getBaseTxFee()
    const byteFee: BN = this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee).toBn()
    return Utils.calcTxLength(tx).mul(byteFee).add(baseFee)
  }

  public estimateBuyMembershipFee(account: KeyringPair, paidTermsId: number, name: string): BN {
    return this.estimateTxFee(
      this.api.tx.members.buyMembership(paidTermsId, new UserInfo({ 'handle': name, 'avatar_uri': '', 'about': '' }))
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
    return this.estimateTxFee(this.api.tx.proposalsEngine.vote(0, 0, 'Approve'))
  }

  public estimateAddOpeningFee(opening: WorkingGroupOpening, module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].addOpening(
        opening.getActivateAt(),
        opening.getCommitment(),
        opening.getText(),
        opening.getOpeningType()
      )
    )
  }

  public estimateAcceptApplicationsFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].acceptApplications(0))
  }

  public estimateApplyOnOpeningFee(account: KeyringPair, module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].applyOnOpening(
        0,
        0,
        account.address,
        0,
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test'
      )
    )
  }

  public estimateBeginApplicantReviewFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].beginApplicantReview(0))
  }

  public estimateFillOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].fillOpening(0, [0], {
        'amount_per_payout': 0,
        'next_payment_at_block': 0,
        'payout_interval': 0,
      })
    )
  }

  public estimateIncreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].increaseStake(0, 0))
  }

  public estimateDecreaseStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].decreaseStake(0, 0))
  }

  public estimateUpdateRoleAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].updateRoleAccount(0, address))
  }

  public estimateUpdateRewardAccountFee(address: string, module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].updateRewardAccount(0, address))
  }

  public estimateLeaveRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].leaveRole(0, 'Long justification text'))
  }

  public estimateWithdrawApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].withdrawApplication(0))
  }

  public estimateTerminateApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].terminateApplication(0))
  }

  public estimateSlashStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].slashStake(0, 0))
  }

  public estimateTerminateRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].terminateRole(
        0,
        'Long justification text explaining why the worker role will be terminated',
        false
      )
    )
  }

  public estimateProposeCreateWorkingGroupLeaderOpeningFee(): BN {
    const opening: WorkingGroupOpening = new WorkingGroupOpening()
      .setActivateAtBlock(undefined)
      .setMaxActiveApplicants(new BN(32))
      .setMaxReviewPeriodLength(new BN(32))
      .setApplicationStakingPolicyAmount(new BN(1))
      .setApplicationCrowdedOutUnstakingPeriodLength(new BN(1))
      .setApplicationExpiredUnstakingPeriodLength(new BN(1))
      .setRoleStakingPolicyAmount(new BN(1))
      .setRoleCrowdedOutUnstakingPeriodLength(new BN(1))
      .setRoleExpiredUnstakingPeriodLength(new BN(1))
      .setSlashableMaxCount(new BN(0))
      .setSlashableMaxPercentPtsPerTime(new BN(0))
      .setSuccessfulApplicantApplicationStakeUnstakingPeriod(new BN(1))
      .setFailedApplicantApplicationStakeUnstakingPeriod(new BN(1))
      .setFailedApplicantRoleStakeUnstakingPeriod(new BN(1))
      .setTerminateApplicationStakeUnstakingPeriod(new BN(1))
      .setTerminateRoleStakeUnstakingPeriod(new BN(1))
      .setExitRoleApplicationStakeUnstakingPeriod(new BN(1))
      .setExitRoleStakeUnstakingPeriod(new BN(1))

    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        0,
        'some long title for the purpose of testing',
        'some long description for the purpose of testing',
        0,
        {
          'activate_at': opening.getActivateAt(),
          'commitment': opening.getCommitment(),
          'human_readable_text': 'Opening readable text',
          'working_group': 'Storage',
        }
      )
    )
  }

  public estimateProposeBeginWorkingGroupLeaderApplicationReviewFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        'Storage'
      )
    )
  }

  public estimateProposeFillLeaderOpeningFee(): BN {
    const fillOpeningParameters: FillOpeningParameters = new FillOpeningParameters()
      .setAmountPerPayout(new BN(1))
      .setNextPaymentAtBlock(new BN(99999))
      .setPayoutInterval(new BN(99999))
      .setOpeningId(new BN(0))
      .setSuccessfulApplicationId(new BN(0))
      .setWorkingGroup('Storage')

    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        fillOpeningParameters.getFillOpeningParameters()
      )
    )
  }

  public estimateProposeTerminateLeaderRoleFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createTerminateWorkingGroupLeaderRoleProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        {
          'worker_id': 0,
          'rationale': 'Exceptionaly long and extraordinary descriptive rationale',
          'slash': true,
          'working_group': 'Storage',
        }
      )
    )
  }

  public estimateProposeLeaderRewardFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetWorkingGroupLeaderRewardProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        0,
        'Storage'
      )
    )
  }

  public estimateProposeDecreaseLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        0,
        'Storage'
      )
    )
  }

  public estimateProposeSlashLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        0,
        'Storage'
      )
    )
  }

  public estimateProposeWorkingGroupMintCapacityFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        0,
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        0,
        0,
        'Storage'
      )
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
    // TODO alter then `applicantStake` type will be introduced
    return this.api.query.councilElection.applicantStakes(address).then((stake) => {
      const parsed = JSON.parse(stake.toString())
      return new BN(parsed.new)
    })
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

  public sudoSetWorkingGroupMintCapacity(sudo: KeyringPair, capacity: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx.sudo.sudo(this.api.tx[module].setMintCapacity(capacity)), sudo, false)
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createRuntimeUpgradeProposal(memberId, name, description, stake, runtime),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createTextProposal(memberId, name, description, stake, text),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSpendingProposal(memberId, title, description, stake, balance, destination),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetContentWorkingGroupMintCapacityProposal(
        memberId,
        title,
        description,
        stake,
        balance
      ),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetValidatorCountProposal(memberId, title, description, stake, validatorCount),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    const leadMemberId: BN = (await this.getMemberIds(leadAccount.address))[0].toBn()
    const addressString: string = leadAccount.address
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetLeadProposal(memberId, title, description, stake, [
        leadMemberId,
        addressString,
      ]),
      account,
      false
    )
  }

  public async proposeEvictStorageProvider(
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    storageProvider: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createEvictStorageProviderProposal(
        memberId,
        title,
        description,
        stake,
        storageProvider
      ),
      account,
      false
    )
  }

  public async proposeStorageRoleParameters(
    account: KeyringPair,
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
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetStorageRoleParametersProposal(memberId, title, description, stake, [
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
      ]),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetElectionParametersProposal(memberId, title, description, stake, [
        announcingPeriod,
        votingPeriod,
        revealingPeriod,
        councilSize,
        candidacyLimit,
        newTermDuration,
        minCouncilStake,
        minVotingStake,
      ]),
      account,
      false
    )
  }

  public async proposeBeginWorkingGroupLeaderApplicationReview(
    account: KeyringPair,
    title: string,
    description: string,
    stake: BN,
    openingId: BN,
    workingGroup: string
  ) {
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        memberId,
        title,
        description,
        stake,
        openingId,
        workingGroup
      ),
      account,
      false
    )
  }

  public approveProposal(account: KeyringPair, memberId: BN, proposal: BN): Promise<void> {
    return this.sender.signAndSend(this.api.tx.proposalsEngine.vote(memberId, proposal, 'Approve'), account, false)
  }

  public batchApproveProposal(council: KeyringPair[], proposal: BN): Promise<void[]> {
    return Promise.all(
      council.map(async (keyPair) => {
        const memberId: BN = (await this.getMemberIds(keyPair.address))[0].toBn()
        await this.approveProposal(keyPair, memberId, proposal)
      })
    )
  }

  public getBlockDuration(): BN {
    return this.api.createType('Moment', this.api.consts.babe.expectedBlockTime).toBn()
  }

  public expectProposalCreated(): Promise<BN> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'ProposalCreated') {
            unsubscribe()
            resolve(new BN(record.event.data[1].toString()))
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

  public expectOpeningAdded(): Promise<BN> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'OpeningAdded') {
            unsubscribe()
            resolve((record.event.data as unknown) as BN)
          }
        })
      })
    })
  }

  public expectLeaderSet(): Promise<BN> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'LeaderSet') {
            unsubscribe()
            resolve((record.event.data as unknown) as BN)
          }
        })
      })
    })
  }

  public expectLeaderTerminated(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'TerminatedLeader') {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectWorkerRewardAmountUpdated(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'WorkerRewardAmountUpdated') {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectWorkerStakeDecreased(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'StakeDecreased') {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectWorkerStakeSlashed(): Promise<void> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'StakeSlashed') {
            unsubscribe()
            resolve()
          }
        })
      })
    })
  }

  public expectApplicationReviewBegan(): Promise<BN> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'BeganApplicationReview') {
            unsubscribe()
            resolve((record.event.data as unknown) as BN)
          }
        })
      })
    })
  }

  public expectMintCapacityChanged(): Promise<BN> {
    return new Promise(async (resolve) => {
      const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'MintCapacityChanged') {
            unsubscribe()
            resolve((record.event.data[1] as unknown) as BN)
          }
        })
      })
    })
  }

  public getTotalIssuance(): Promise<BN> {
    return this.api.query.balances.totalIssuance<Balance>()
  }

  public async getRequiredProposalStake(numerator: number, denominator: number): Promise<BN> {
    const issuance: number = await (await this.getTotalIssuance()).toNumber()
    const stake = (issuance * numerator) / denominator
    return new BN(stake.toFixed(0))
  }

  public getProposalCount(): Promise<BN> {
    return this.api.query.proposalsEngine.proposalCount<u32>()
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

  public async createStorageProvider(account: KeyringPair): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0].toBn()
    await this.sender.signAndSend(this.api.tx.actors.roleEntryRequest('StorageProvider', memberId), account, false)
    await this.sender.signAndSend(this.api.tx.actors.stake('StorageProvider', account.address), account, false)
    return
  }

  public async isStorageProvider(address: string): Promise<boolean> {
    const storageProviders: Vec<AccountId> = await this.api.query.actors.accountIdsByRole<Vec<AccountId>>(
      'StorageProvider'
    )
    const accountWorkers: BN = await this.getWorkerIdByRoleAccount(address, WorkingGroups.StorageWorkingGroup)
    return accountWorkers !== undefined
  }

  public async addOpening(
    leader: KeyringPair,
    opening: WorkingGroupOpening,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(this.createAddOpeningTransaction(opening, module), leader, expectFailure)
  }

  public async sudoAddOpening(sudo: KeyringPair, opening: WorkingGroupOpening, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.createAddOpeningTransaction(opening, module)),
      sudo,
      false
    )
  }

  public async proposeCreateWorkingGroupLeaderOpening(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    opening: WorkingGroupOpening,
    workingGroup: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        memberId,
        title,
        description,
        proposalStake,
        opening.getAddOpeningParameters(workingGroup)
      ),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        memberId,
        title,
        description,
        proposalStake,
        fillOpeningParameters.getFillOpeningParameters()
      ),
      account,
      false
    )
  }

  public async proposeTerminateLeaderRole(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    leadWorkerId: BN,
    rationale: string,
    slash: boolean,
    workingGroup: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
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
      account,
      false
    )
  }

  public async proposeLeaderReward(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: BN,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetWorkingGroupLeaderRewardProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ),
      account,
      false
    )
  }

  public async proposeDecreaseLeaderStake(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: BN,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ),
      account,
      false
    )
  }

  public async proposeSlashLeaderStake(
    account: KeyringPair,
    title: string,
    description: string,
    proposalStake: BN,
    workerId: BN,
    rewardAmount: BN,
    workingGroup: string
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        memberId,
        title,
        description,
        proposalStake,
        workerId,
        rewardAmount,
        workingGroup
      ),
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
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        memberId,
        title,
        description,
        proposalStake,
        mintCapacity,
        workingGroup
      ),
      account,
      false
    )
  }

  private createAddOpeningTransaction(
    opening: WorkingGroupOpening,
    module: WorkingGroups
  ): SubmittableExtrinsic<'promise'> {
    return this.api.tx[module].addOpening(
      opening.getActivateAt(),
      opening.getCommitment(),
      opening.getText(),
      opening.getOpeningType()
    )
  }

  public async acceptApplications(leader: KeyringPair, openingId: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].acceptApplications(openingId), leader, false)
  }

  public async beginApplicantReview(leader: KeyringPair, openingId: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].beginApplicantReview(openingId), leader, false)
  }

  public async sudoBeginApplicantReview(sudo: KeyringPair, openingId: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.sudo.sudo(this.api.tx[module].beginApplicantReview(openingId)),
      sudo,
      false
    )
  }

  public async applyOnOpening(
    account: KeyringPair,
    roleAccountAddress: string,
    openingId: BN,
    roleStake: BN,
    applicantStake: BN,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void> {
    const memberId: BN = (await this.getMemberIds(account.address))[0]
    return this.sender.signAndSend(
      this.api.tx[module].applyOnOpening(memberId, openingId, roleAccountAddress, roleStake, applicantStake, text),
      account,
      expectFailure
    )
  }

  public async batchApplyOnOpening(
    accounts: KeyringPair[],
    openingId: BN,
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
    openingId: BN,
    applicationId: BN[],
    amountPerPayout: BN,
    nextPaymentBlock: BN,
    payoutInterval: BN,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx[module].fillOpening(openingId, applicationId, {
        'amount_per_payout': amountPerPayout,
        'next_payment_at_block': nextPaymentBlock,
        'payout_interval': payoutInterval,
      }),
      leader,
      false
    )
  }

  public async sudoFillOpening(
    sudo: KeyringPair,
    openingId: BN,
    applicationId: BN[],
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

  public async increaseStake(worker: KeyringPair, workerId: BN, stake: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].increaseStake(workerId, stake), worker, false)
  }

  public async decreaseStake(
    leader: KeyringPair,
    workerId: BN,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].decreaseStake(workerId, stake), leader, expectFailure)
  }

  public async slashStake(
    leader: KeyringPair,
    workerId: BN,
    stake: BN,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].slashStake(workerId, stake), leader, expectFailure)
  }

  public async updateRoleAccount(
    worker: KeyringPair,
    workerId: BN,
    newRoleAccount: string,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].updateRoleAccount(workerId, newRoleAccount), worker, false)
  }

  public async updateRewardAccount(
    worker: KeyringPair,
    workerId: BN,
    newRewardAccount: string,
    module: WorkingGroups
  ): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].updateRewardAccount(workerId, newRewardAccount), worker, false)
  }

  public async withdrawApplication(account: KeyringPair, workerId: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].withdrawApplication(workerId), account, false)
  }

  public async batchWithdrawApplication(accounts: KeyringPair[], module: WorkingGroups): Promise<void[]> {
    return Promise.all(
      accounts.map(async (keyPair) => {
        const applicationIds: BN[] = await this.getApplicationsIdsByRoleAccount(keyPair.address, module)
        await this.withdrawApplication(keyPair, applicationIds[0], module)
      })
    )
  }

  public async terminateApplication(leader: KeyringPair, applicationId: BN, module: WorkingGroups): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].terminateApplication(applicationId), leader, false)
  }

  public async batchTerminateApplication(
    leader: KeyringPair,
    roleAccounts: KeyringPair[],
    module: WorkingGroups
  ): Promise<void[]> {
    return Promise.all(
      roleAccounts.map(async (keyPair) => {
        const applicationIds: BN[] = await this.getActiveApplicationsIdsByRoleAccount(keyPair.address, module)
        await this.terminateApplication(leader, applicationIds[0], module)
      })
    )
  }

  public async terminateRole(
    leader: KeyringPair,
    applicationId: BN,
    text: string,
    module: WorkingGroups,
    expectFailure: boolean
  ): Promise<void> {
    return this.sender.signAndSend(this.api.tx[module].terminateRole(applicationId, text, false), leader, expectFailure)
  }

  public async leaveRole(
    account: KeyringPair,
    text: string,
    expectFailure: boolean,
    module: WorkingGroups
  ): Promise<void> {
    const workerId: BN = await this.getWorkerIdByRoleAccount(account.address, module)
    return this.sender.signAndSend(this.api.tx[module].leaveRole(workerId, text), account, expectFailure)
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

  public async getStorageRoleParameters(): Promise<RoleParameters> {
    return (await this.api.query.actors.parameters<Option<RoleParameters>>('StorageProvider')).unwrap()
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

  public async getNextOpeningId(module: WorkingGroups): Promise<BN> {
    return this.api.query[module].nextOpeningId<u32>()
  }

  public async getNextApplicationId(module: WorkingGroups): Promise<BN> {
    return this.api.query[module].nextApplicationId<u32>()
  }

  public async getOpening(id: BN, module: WorkingGroups): Promise<Opening> {
    return ((await this.api.query[module].openingById<Codec[]>(id))[0] as unknown) as Opening
  }

  public async getHiringOpening(id: BN): Promise<HiringOpening> {
    return ((await this.api.query.hiring.openingById<Codec[]>(id))[0] as unknown) as HiringOpening
  }

  public async getWorkers(module: WorkingGroups): Promise<Worker[]> {
    return ((await this.api.query[module].workerById<Codec[]>())[1] as unknown) as Worker[]
  }

  public async getWorkerById(id: BN, module: WorkingGroups): Promise<Worker> {
    return ((await this.api.query[module].workerById<Codec[]>(id))[0] as unknown) as Worker
  }

  public async getWorkerIdByRoleAccount(address: string, module: WorkingGroups): Promise<BN> {
    const workersAndIds = await this.api.query[module].workerById<Codec[]>()
    const workers: Worker[] = (workersAndIds[1] as unknown) as Worker[]
    const ids: WorkerId[] = (workersAndIds[0] as unknown) as WorkerId[]
    const index: number = workers.findIndex((worker) => worker.role_account_id.toString() === address)
    return ids[index]
  }

  public async getApplicationsIdsByRoleAccount(address: string, module: WorkingGroups): Promise<BN[]> {
    const applicationsAndIds = await this.api.query[module].applicationById<Codec[]>()
    const applications: Application[] = (applicationsAndIds[1] as unknown) as Application[]
    const ids: ApplicationId[] = (applicationsAndIds[0] as unknown) as ApplicationId[]
    return applications
      .map((application, index) => (application.role_account_id.toString() === address ? ids[index] : undefined))
      .filter((id) => id !== undefined) as BN[]
  }

  public async getHiringApplicationById(id: BN): Promise<HiringApplication> {
    return ((await this.api.query.hiring.applicationById<Codec[]>(id))[0] as unknown) as HiringApplication
  }

  public async getApplicationById(id: BN, module: WorkingGroups): Promise<Application> {
    return ((await this.api.query[module].applicationById<Codec[]>(id))[0] as unknown) as Application
  }

  public async getActiveApplicationsIdsByRoleAccount(address: string, module: WorkingGroups): Promise<BN[]> {
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
    ).filter((index) => index !== undefined) as BN[]
  }

  public async getStake(id: BN): Promise<Stake> {
    return ((await this.api.query.stake.stakes<Codec[]>(id))[0] as unknown) as Stake
  }

  public async getWorkerStakeAmount(workerId: BN, module: WorkingGroups): Promise<BN> {
    const stakeId: BN = (await this.getWorkerById(workerId, module)).role_stake_profile.unwrap().stake_id
    return (((await this.getStake(stakeId)).staking_status.value as unknown) as StakedState).staked_amount
  }

  public async getRewardRelationship(id: BN): Promise<RewardRelationship> {
    return ((
      await this.api.query.recurringRewards.rewardRelationships<Codec[]>(id)
    )[0] as unknown) as RewardRelationship
  }

  public async getWorkerRewardAccount(workerId: BN, module: WorkingGroups): Promise<string> {
    const rewardRelationshipId: BN = (await this.getWorkerById(workerId, module)).reward_relationship.unwrap()
    return (await this.getRewardRelationship(rewardRelationshipId)).getField('account').toString()
  }

  public async getLeadWorkerId(module: WorkingGroups): Promise<BN | undefined> {
    return (await this.api.query[module].currentLead<Option<WorkerId>>()).unwrapOr(undefined)
  }
}
