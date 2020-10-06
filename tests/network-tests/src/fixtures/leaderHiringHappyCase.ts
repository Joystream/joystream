import { Fixture } from './interfaces/fixture'
import {
  AddLeaderOpeningFixture,
  ApplyForOpeningFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
} from './workingGroupModule'
import { BuyMembershipHappyCaseFixture } from './membershipModule'
import { ApiWrapper, WorkingGroups } from '../utils/apiWrapper'
import { OpeningId } from '@joystream/types/hiring'
import { KeyringPair } from '@polkadot/keyring/types'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'

export class LeaderHiringHappyCaseFixture implements Fixture {
  private apiWrapper: ApiWrapper
  private sudo: KeyringPair
  private nKeyPairs: KeyringPair[]
  private leadKeyPair: KeyringPair[]
  private paidTerms: PaidTermId
  private applicationStake: BN
  private roleStake: BN
  private openingActivationDelay: BN
  private rewardInterval: BN
  private firstRewardInterval: BN
  private payoutAmount: BN
  private workingGroup: WorkingGroups

  constructor(
    apiWrapper: ApiWrapper,
    sudo: KeyringPair,
    nKeyPairs: KeyringPair[],
    leadKeyPair: KeyringPair[],
    paidTerms: PaidTermId,
    applicationStake: BN,
    roleStake: BN,
    openingActivationDelay: BN,
    rewardInterval: BN,
    firstRewardInterval: BN,
    payoutAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.apiWrapper = apiWrapper
    this.sudo = sudo
    this.nKeyPairs = nKeyPairs
    this.leadKeyPair = leadKeyPair
    this.paidTerms = paidTerms
    this.applicationStake = applicationStake
    this.roleStake = roleStake
    this.openingActivationDelay = openingActivationDelay
    this.rewardInterval = rewardInterval
    this.firstRewardInterval = firstRewardInterval
    this.payoutAmount = payoutAmount
    this.workingGroup = workingGroup
  }

  public async runner(expectFailure: boolean): Promise<void> {
    const happyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.apiWrapper,
      this.sudo,
      this.nKeyPairs,
      this.paidTerms
    )
    // Creating a set of members
    await happyCaseFixture.runner(false)

    const leaderHappyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.apiWrapper,
      this.sudo,
      this.leadKeyPair,
      this.paidTerms
    )
    // Buying membership for leader account
    await leaderHappyCaseFixture.runner(false)

    const addLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
      this.apiWrapper,
      this.nKeyPairs,
      this.sudo,
      this.applicationStake,
      this.roleStake,
      this.openingActivationDelay,
      this.workingGroup
    )
    // Add lead opening
    await addLeaderOpeningFixture.runner(false)

    let applyForLeaderOpeningFixture: ApplyForOpeningFixture
    // Apply for lead opening
    await (async () => {
      applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
        this.apiWrapper,
        this.leadKeyPair,
        this.sudo,
        this.applicationStake,
        this.roleStake,
        addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
        this.workingGroup
      )
      await applyForLeaderOpeningFixture.runner(false)
    })()

    let beginLeaderApplicationReviewFixture: BeginLeaderApplicationReviewFixture
    // Begin lead application review
    await (async () => {
      beginLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
        this.apiWrapper,
        this.sudo,
        addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
        this.workingGroup
      )
      await beginLeaderApplicationReviewFixture.runner(false)
    })()

    let fillLeaderOpeningFixture: FillLeaderOpeningFixture
    // Fill lead opening
    await (async () => {
      fillLeaderOpeningFixture = new FillLeaderOpeningFixture(
        this.apiWrapper,
        this.leadKeyPair,
        this.sudo,
        addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
        this.firstRewardInterval,
        this.rewardInterval,
        this.payoutAmount,
        this.workingGroup
      )
      await fillLeaderOpeningFixture.runner(false)
    })()
  }
}
