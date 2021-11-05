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
  OpeningPolicyCommitment,
  Opening as WorkingGroupOpening,
} from '@joystream/types/working-group'
import { ElectionStake, Seat } from '@joystream/types/council'
import { AccountInfo, Balance, BalanceOf, BlockNumber, EventRecord } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender, LogLevel } from './sender'
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
import { ContentId, DataObject } from '@joystream/types/storage'
import { extendDebug } from './Debugger'
import { InvertedPromise } from './InvertedPromise'
import { VideoId } from '@joystream/types/content'
import { ChannelId } from '@joystream/types/common'

export enum WorkingGroups {
  StorageWorkingGroup = 'storageWorkingGroup',
  ContentDirectoryWorkingGroup = 'contentDirectoryWorkingGroup',
}

export class ApiFactory {
  private readonly api: ApiPromise
  private readonly keyring: Keyring
  // number used as part of key derivation path
  private keyId = 0
  // mapping from account address to key id.
  // To be able to re-derive keypair externally when mini-secret is known.
  readonly addressesToKeyId: Map<string, number> = new Map()
  // mini secret used in SURI key derivation path
  private readonly miniSecret: string

  // source of funds for all new accounts
  private readonly treasuryAccount: string

  public static async create(
    provider: WsProvider,
    treasuryAccountUri: string,
    sudoAccountUri: string,
    miniSecret: string
  ): Promise<ApiFactory> {
    const debug = extendDebug('api-factory')
    let connectAttempts = 0
    while (true) {
      connectAttempts++
      debug(`Connecting to chain, attempt ${connectAttempts}..`)
      try {
        const api = new ApiPromise({ provider, types })

        // Wait for api to be connected and ready
        await api.isReadyOrError

        // If a node was just started up it might take a few seconds to start producing blocks
        // Give it a few seconds to be ready.
        await Utils.wait(5000)

        return new ApiFactory(api, treasuryAccountUri, sudoAccountUri, miniSecret)
      } catch (err) {
        if (connectAttempts === 3) {
          throw new Error('Unable to connect to chain')
        }
      }
      await Utils.wait(5000)
    }
  }

  constructor(api: ApiPromise, treasuryAccountUri: string, sudoAccountUri: string, miniSecret: string) {
    this.api = api
    this.keyring = new Keyring({ type: 'sr25519' })
    this.treasuryAccount = this.keyring.addFromUri(treasuryAccountUri).address
    this.keyring.addFromUri(sudoAccountUri)
    this.miniSecret = miniSecret
    this.addressesToKeyId = new Map()
    this.keyId = 0
  }

  public getApi(label: string): Api {
    return new Api(this, this.api, this.treasuryAccount, this.keyring, label)
  }

  public createKeyPairs(n: number): { key: KeyringPair; id: number }[] {
    const keys: { key: KeyringPair; id: number }[] = []
    for (let i = 0; i < n; i++) {
      const id = this.keyId++
      const uri = `${this.miniSecret}//testing//${id}`
      const key = this.keyring.addFromUri(uri)
      keys.push({ key, id })
      this.addressesToKeyId.set(key.address, id)
    }
    return keys
  }

  public keyGenInfo(): string {
    const start = 0
    const final = this.keyId
    return JSON.stringify({
      start,
      final,
    })
  }
}

export class Api {
  private readonly factory: ApiFactory
  private readonly api: ApiPromise
  private readonly sender: Sender
  // source of funds for all new accounts
  private readonly treasuryAccount: string

  constructor(factory: ApiFactory, api: ApiPromise, treasuryAccount: string, keyring: Keyring, label: string) {
    this.factory = factory
    this.api = api
    this.treasuryAccount = treasuryAccount
    this.sender = new Sender(api, keyring, label)
  }

  public enableDebugTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Debug)
  }

  public enableVerboseTxLogs(): void {
    this.sender.setLogLevel(LogLevel.Verbose)
  }

  public createKeyPairs(n: number): { key: KeyringPair; id: number }[] {
    return this.factory.createKeyPairs(n)
  }

  public keyGenInfo(): string {
    return this.factory.keyGenInfo()
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

  public async makeSudoCall(tx: SubmittableExtrinsic<'promise'>): Promise<ISubmittableResult> {
    const sudo = await this.api.query.sudo.key()
    return this.sender.signAndSend(this.api.tx.sudo.sudo(tx), sudo)
  }

  public createPaidTermId(value: BN): PaidTermId {
    return this.api.createType('PaidTermId', value)
  }

  public async buyMembership(account: string, paidTermsId: PaidTermId, name: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(
      this.api.tx.members.buyMembership(paidTermsId, /* Handle: */ name, /* Avatar uri: */ '', /* About: */ ''),
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

  public getPaidMembershipTerms(paidTermsId: PaidTermId): Promise<PaidMembershipTerms> {
    return this.api.query.members.paidMembershipTermsById<PaidMembershipTerms>(paidTermsId)
  }

  public async getMembershipFee(paidTermsId: PaidTermId): Promise<BN> {
    const terms: PaidMembershipTerms = await this.getPaidMembershipTerms(paidTermsId)
    return terms.fee
  }

  // This method does not take into account weights and the runtime weight to fees computation!
  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): BN {
    const byteFee: BN = this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee)
    return Utils.calcTxLength(tx).mul(byteFee)
  }

  public estimateBuyMembershipFee(account: string, paidTermsId: PaidTermId, name: string): BN {
    return this.estimateTxFee(
      this.api.tx.members.buyMembership(paidTermsId, /* Handle: */ name, /* Avatar uri: */ '', /* About: */ '')
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
      this.api.tx.proposalsCodex.createSetElectionParametersProposal(stake, title, description, stake, {
        announcing_period: announcingPeriod,
        voting_period: votingPeriod,
        revealing_period: revealingPeriod,
        council_size: councilSize,
        candidacy_limit: candidacyLimit,
        new_term_duration: newTermDuration,
        min_council_stake: minCouncilStake,
        min_voting_stake: minVotingStake,
      })
    )
  }

  public estimateVoteForProposalFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsEngine.vote(
        this.api.createType('MemberId', 0),
        this.api.createType('ProposalId', 0),
        'Approve'
      )
    )
  }

  public estimateAddOpeningFee(module: WorkingGroups): BN {
    const commitment: OpeningPolicyCommitment = this.api.createType('OpeningPolicyCommitment', {
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
      this.api.tx[module].addOpening('CurrentBlock', commitment, 'Human readable text', 'Worker')
    )
  }

  public estimateAcceptApplicationsFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].acceptApplications(this.api.createType('OpeningId', 0)))
  }

  public estimateApplyOnOpeningFee(account: string, module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].applyOnOpening(
        this.api.createType('MemberId', 0),
        this.api.createType('OpeningId', 0),
        account,
        null,
        null,
        'Some testing text used for estimation purposes which is longer than text expected during the test'
      )
    )
  }

  public estimateBeginApplicantReviewFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].beginApplicantReview(0))
  }

  public estimateFillOpeningFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].fillOpening(0, this.api.createType('ApplicationIdSet', [0]), {
        'amount_per_payout': 0,
        'next_payment_at_block': 0,
        'payout_interval': 0,
      })
    )
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
    return this.estimateTxFee(
      this.api.tx[module].leaveRole(this.api.createType('WorkerId', 0), 'Long justification text')
    )
  }

  public estimateWithdrawApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].withdrawApplication(this.api.createType('ApplicationId', 0)))
  }

  public estimateTerminateApplicationFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].terminateApplication(this.api.createType('ApplicationId', 0)))
  }

  public estimateSlashStakeFee(module: WorkingGroups): BN {
    return this.estimateTxFee(this.api.tx[module].slashStake(this.api.createType('WorkerId', 0), 0))
  }

  public estimateTerminateRoleFee(module: WorkingGroups): BN {
    return this.estimateTxFee(
      this.api.tx[module].terminateRole(
        this.api.createType('WorkerId', 0),
        'Long justification text explaining why the worker role will be terminated',
        false
      )
    )
  }

  public estimateProposeCreateWorkingGroupLeaderOpeningFee(): BN {
    const commitment: OpeningPolicyCommitment = this.api.createType('OpeningPolicyCommitment', {
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
      this.api.tx.proposalsCodex.createAddWorkingGroupLeaderOpeningProposal(
        0,
        'some long title for the purpose of testing',
        'some long description for the purpose of testing',
        null,
        {
          activate_at: 'CurrentBlock',
          commitment: commitment,
          human_readable_text: 'Opening readable text',
          working_group: 'Storage',
        }
      )
    )
  }

  public estimateProposeBeginWorkingGroupLeaderApplicationReviewFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createBeginReviewWorkingGroupLeaderApplicationsProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        this.api.createType('OpeningId', 0),
        'Storage'
      )
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
      this.api.tx.proposalsCodex.createFillWorkingGroupLeaderOpeningProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        fillOpeningParameters
      )
    )
  }

  public estimateProposeTerminateLeaderRoleFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createTerminateWorkingGroupLeaderRoleProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        {
          'worker_id': this.api.createType('WorkerId', 0),
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
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      )
    )
  }

  public estimateProposeDecreaseLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createDecreaseWorkingGroupLeaderStakeProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      )
    )
  }

  public estimateProposeSlashLeaderStakeFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSlashWorkingGroupLeaderStakeProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        this.api.createType('WorkerId', 0),
        0,
        'Storage'
      )
    )
  }

  public estimateProposeWorkingGroupMintCapacityFee(): BN {
    return this.estimateTxFee(
      this.api.tx.proposalsCodex.createSetWorkingGroupMintCapacityProposal(
        this.api.createType('MemberId', 0),
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        'Some testing text used for estimation purposes which is longer than text expected during the test',
        null,
        0,
        'Storage'
      )
    )
  }

  private applyForCouncilElection(account: string, amount: BN): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.councilElection.apply(amount), account)
  }

  public batchApplyForCouncilElection(accounts: string[], amount: BN): Promise<ISubmittableResult[]> {
    return Promise.all(accounts.map(async (account) => this.applyForCouncilElection(account, amount)))
  }

  public async getCouncilElectionStake(address: string): Promise<BN> {
    return (((await this.api.query.councilElection.applicantStakes(address)) as unknown) as ElectionStake).new
  }

  private voteForCouncilMember(account: string, nominee: string, salt: string, stake: BN): Promise<ISubmittableResult> {
    const hashedVote: string = Utils.hashVote(nominee, salt)
    return this.sender.signAndSend(this.api.tx.councilElection.vote(hashedVote, stake), account)
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

  private revealVote(account: string, commitment: string, nominee: string, salt: string): Promise<ISubmittableResult> {
    return this.sender.signAndSend(this.api.tx.councilElection.reveal(commitment, nominee, salt), account)
  }

  public batchRevealVote(accounts: string[], nominees: string[], salt: string[]): Promise<ISubmittableResult[]> {
    return Promise.all(
      accounts.map(async (account, index) => {
        const commitment = Utils.hashVote(nominees[index], salt[index])
        return this.revealVote(account, commitment, nominees[index], salt[index])
      })
    )
  }

  public sudoStartAnnouncingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageAnnouncing(endsAtBlock))
  }

  public sudoStartVotingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageVoting(endsAtBlock))
  }

  public sudoStartRevealingPeriod(endsAtBlock: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.councilElection.setStageRevealing(endsAtBlock))
  }

  public sudoSetCouncilMintCapacity(capacity: BN): Promise<ISubmittableResult> {
    return this.makeSudoCall(this.api.tx.council.setCouncilMintCapacity(capacity))
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

  // Subscribe to system events, resolves to an InvertedPromise or rejects if subscription fails.
  // The inverted promise wraps a promise which resolves when the Proposal with id specified
  // is executed.
  // - On successful execution the wrapped promise resolves to `[true, events]`
  // - On failed execution the wrapper promise resolves to `[false, events]`
  public async subscribeToProposalExecutionResult(id: ProposalId): Promise<InvertedPromise<[boolean, EventRecord[]]>> {
    const invertedPromise = new InvertedPromise<[boolean, EventRecord[]]>()
    const unsubscribe = await this.api.query.system.events<Vec<EventRecord>>((events) => {
      events.forEach((record) => {
        if (
          record.event.method &&
          record.event.method.toString() === 'ProposalStatusUpdated' &&
          record.event.data[0].eq(id) &&
          record.event.data[1].toString().includes('executed')
        ) {
          unsubscribe()
          invertedPromise.resolve([true, events])
        } else if (
          record.event.method &&
          record.event.method.toString() === 'ProposalStatusUpdated' &&
          record.event.data[0].eq(id) &&
          record.event.data[1].toString().includes('executionFailed')
        ) {
          unsubscribe()
          invertedPromise.resolve([false, events])
        }
      })
    })

    return invertedPromise
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

    const commitment: OpeningPolicyCommitment = this.api.createType('OpeningPolicyCommitment', {
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

    const commitment: OpeningPolicyCommitment = this.api.createType('OpeningPolicyCommitment', {
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
    const commitment: OpeningPolicyCommitment = this.api.createType('OpeningPolicyCommitment', {
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
    commitment: OpeningPolicyCommitment,
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
    const applicationsAndIds: [StorageKey, Application][] = await this.api.query[
      module
    ].applicationById.entries<Application>()
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

  async getDataByContentId(contentId: ContentId): Promise<DataObject | null> {
    const dataObject = await this.api.query.dataDirectory.dataByContentId<Option<DataObject>>(contentId)
    return dataObject.unwrapOr(null)
  }

  async getMemberControllerAccount(memberId: number): Promise<string | undefined> {
    return (await this.api.query.members.membershipById(memberId))?.controller_account.toString()
  }

  async createMockChannel(memberId: number, memberControllerAccount?: string): Promise<ChannelId | null> {
    memberControllerAccount = memberControllerAccount || (await this.getMemberControllerAccount(memberId))

    if (!memberControllerAccount) {
      throw new Error('invalid member id')
    }

    // Create a channel without any assets
    const tx = this.api.tx.content.createChannel(
      { Member: memberId },
      {
        assets: [],
        meta: null,
        reward_account: null,
      }
    )

    const result = await this.sender.signAndSend(tx, memberControllerAccount)

    const record = this.findEventRecord(result.events, 'content', 'ChannelCreated')
    if (record) {
      return record.event.data[1] as ChannelId
    }

    return null
  }

  async createMockVideo(
    memberId: number,
    channelId: number,
    memberControllerAccount?: string
  ): Promise<VideoId | null> {
    memberControllerAccount = memberControllerAccount || (await this.getMemberControllerAccount(memberId))

    if (!memberControllerAccount) {
      throw new Error('invalid member id')
    }

    // Create a video without any assets
    const tx = this.api.tx.content.createVideo({ Member: memberId }, channelId, {
      assets: [],
      meta: null,
    })

    const result = await this.sender.signAndSend(tx, memberControllerAccount)

    const record = this.findEventRecord(result.events, 'content', 'VideoCreated')
    if (record) {
      return record.event.data[2] as VideoId
    }

    return null
  }
}
