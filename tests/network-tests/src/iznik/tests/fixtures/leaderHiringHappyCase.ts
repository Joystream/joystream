import { Fixture } from './interfaces/fixture'
import tap from 'tap'
import {
  AddLeaderOpeningFixture,
  ApplyForOpeningFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
} from './workingGroupModule'
import { BuyMembershipHappyCaseFixture } from './membershipModule'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { OpeningId } from '@alexandria/types/hiring'
import { KeyringPair } from '@polkadot/keyring/types'
import { PaidTermId } from '@alexandria/types/members'
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
    tap.test('Creating a set of members', async () => happyCaseFixture.runner(false))

    const leaderHappyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.apiWrapper,
      this.sudo,
      this.leadKeyPair,
      this.paidTerms
    )
    tap.test('Buying membership for leader account', async () => leaderHappyCaseFixture.runner(false))

    const addLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
      this.apiWrapper,
      this.nKeyPairs,
      this.sudo,
      this.applicationStake,
      this.roleStake,
      this.openingActivationDelay,
      this.workingGroup
    )
    tap.test('Add lead opening', async () => await addLeaderOpeningFixture.runner(false))

    let applyForLeaderOpeningFixture: ApplyForOpeningFixture
    tap.test('Apply for lead opening', async () => {
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
    })

    let beginLeaderApplicationReviewFixture: BeginLeaderApplicationReviewFixture
    tap.test('Begin lead application review', async () => {
      beginLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
        this.apiWrapper,
        this.sudo,
        addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
        this.workingGroup
      )
      await beginLeaderApplicationReviewFixture.runner(false)
    })

    let fillLeaderOpeningFixture: FillLeaderOpeningFixture
    tap.test('Fill lead opening', async () => {
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
    })
  }
}
