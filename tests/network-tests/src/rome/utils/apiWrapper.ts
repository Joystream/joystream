import { ApiPromise, WsProvider } from '@polkadot/api'
import { Option, Vec, Bytes, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { UserInfo, PaidMembershipTerms, MemberId } from '@rome/types/lib/members'
import { Seat, VoteKind } from '@rome/types'
import { Balance, EventRecord } from '@polkadot/types/interfaces'
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

  public estimateProposeRuntimeUpgradeFee(stake: BN, name: string, description: string, runtime: string): BN {
    return this.estimateTxFee(this.api.tx.proposals.createProposal(stake, name, description, runtime))
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

  public estimateVoteForRuntimeProposalFee(): BN {
    return this.estimateTxFee(this.api.tx.proposals.voteOnProposal(0, 'Approve'))
  }

  public newEstimate(): BN {
    return new BN(100)
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

  public getBestBlock(): Promise<BN> {
    return this.api.derive.chain.bestNumber()
  }

  public getCouncil(): Promise<Seat[]> {
    return this.api.query.council.activeCouncil<Vec<Codec>>().then((seats) => {
      return JSON.parse(seats.toString())
    })
  }

  public getRuntime(): Promise<Bytes> {
    return this.api.query.substrate.code<Bytes>()
  }

  public proposeRuntime(
    account: KeyringPair,
    stake: BN,
    name: string,
    description: string,
    runtime: string
  ): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.proposals.createProposal(stake, name, description, runtime),
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

  public approveProposal(account: KeyringPair, proposal: BN): Promise<void> {
    return this.sender.signAndSend(
      this.api.tx.proposals.voteOnProposal(proposal, new VoteKind('Approve')),
      account,
      false
    )
  }

  public batchApproveProposal(council: KeyringPair[], proposal: BN): Promise<void[]> {
    return Promise.all(
      council.map(async (keyPair) => {
        await this.approveProposal(keyPair, proposal)
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
          if (record.event.method.toString() === 'ProposalCreated') {
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
            record.event.method.toString() === 'ProposalStatusUpdated' &&
            record.event.data[1].toString().includes('Finalized')
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
}
