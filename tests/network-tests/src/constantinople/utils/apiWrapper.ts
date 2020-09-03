import { ApiPromise, WsProvider } from '@polkadot/api'
import { Option, Vec, Bytes, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { UserInfo, PaidMembershipTerms, MemberId } from '@constantinople/types/lib/members'
import { Mint, MintId } from '@constantinople/types/lib/mint'
import { Lead, LeadId } from '@constantinople/types/lib/content-working-group'
import { RoleParameters } from '@constantinople/types/lib/roles'
import { Seat } from '@constantinople/types'
import { Balance, EventRecord, AccountId, BlockNumber, BalanceOf } from '@polkadot/types/interfaces'
import BN from 'bn.js'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Sender } from './sender'
import { Utils } from './utils'

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

  public estimateProposeWorkingGroupMintCapacityFee(title: string, description: string, stake: BN, balance: BN): BN {
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

  public async proposeWorkingGroupMintCapacity(
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
      await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method && record.event.method.toString() === 'ProposalCreated') {
            resolve(new BN(record.event.data[1].toString()))
          }
        })
      })
    })
  }

  public expectRuntimeUpgraded(): Promise<void> {
    return new Promise(async (resolve) => {
      await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (record.event.method.toString() === 'RuntimeUpdated') {
            resolve()
          }
        })
      })
    })
  }

  public expectProposalFinalized(): Promise<void> {
    return new Promise(async (resolve) => {
      await this.api.query.system.events<Vec<EventRecord>>((events) => {
        events.forEach((record) => {
          if (
            record.event.method &&
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[1].toString().includes('Executed')
          ) {
            resolve()
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

  public async getWorkingGroupMintCapacity(): Promise<BN> {
    const mintId: MintId = await this.api.query.contentWorkingGroup.mint<MintId>()
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
    return storageProviders.map((accountId) => accountId.toString()).includes(address)
  }

  public async getStorageRoleParameters(): Promise<RoleParameters> {
    return (await this.api.query.actors.parameters<Option<RoleParameters>>('StorageProvider')).unwrap()
  }

  public async getAnnouncingPeriod(): Promise<BN> {
    return await this.api.query.councilElection.announcingPeriod<BlockNumber>()
  }

  public async getVotingPeriod(): Promise<BN> {
    return await this.api.query.councilElection.votingPeriod<BlockNumber>()
  }

  public async getRevealingPeriod(): Promise<BN> {
    return await this.api.query.councilElection.revealingPeriod<BlockNumber>()
  }

  public async getCouncilSize(): Promise<BN> {
    return await this.api.query.councilElection.councilSize<u32>()
  }

  public async getCandidacyLimit(): Promise<BN> {
    return await this.api.query.councilElection.candidacyLimit<u32>()
  }

  public async getNewTermDuration(): Promise<BN> {
    return await this.api.query.councilElection.newTermDuration<BlockNumber>()
  }

  public async getMinCouncilStake(): Promise<BN> {
    return await this.api.query.councilElection.minCouncilStake<BalanceOf>()
  }

  public async getMinVotingStake(): Promise<BN> {
    return await this.api.query.councilElection.minVotingStake<BalanceOf>()
  }
}
