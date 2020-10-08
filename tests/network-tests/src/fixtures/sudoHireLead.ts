import { Fixture } from '../IFixture'
import {
  AddLeaderOpeningFixture,
  ApplyForOpeningFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
} from './workingGroupModule'
import { BuyMembershipHappyCaseFixture } from './membershipModule'
import { Api, WorkingGroups } from '../Api'
import { OpeningId } from '@joystream/types/hiring'
import { KeyringPair } from '@polkadot/keyring/types'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'

export class SudoHireLeadFixture implements Fixture {
  private api: Api
  private sudo: KeyringPair
  private leadKeyPair: KeyringPair
  private paidTerms: PaidTermId
  private applicationStake: BN
  private roleStake: BN
  private openingActivationDelay: BN
  private rewardInterval: BN
  private firstRewardInterval: BN
  private payoutAmount: BN
  private workingGroup: WorkingGroups

  constructor(
    api: Api,
    sudo: KeyringPair,
    leadKeyPair: KeyringPair,
    paidTerms: PaidTermId,
    applicationStake: BN,
    roleStake: BN,
    openingActivationDelay: BN,
    rewardInterval: BN,
    firstRewardInterval: BN,
    payoutAmount: BN,
    workingGroup: WorkingGroups
  ) {
    this.api = api
    this.sudo = sudo
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
    const leaderHappyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
      this.api,
      this.sudo,
      [this.leadKeyPair],
      this.paidTerms
    )
    // Buying membership for leader account
    await leaderHappyCaseFixture.runner(false)

    const addLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
      this.api,
      [this.leadKeyPair],
      this.sudo,
      this.applicationStake,
      this.roleStake,
      this.openingActivationDelay,
      this.workingGroup
    )
    // Add lead opening
    await addLeaderOpeningFixture.runner(false)

    const applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
      this.api,
      [this.leadKeyPair],
      this.sudo,
      this.applicationStake,
      this.roleStake,
      addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      this.workingGroup
    )
    await applyForLeaderOpeningFixture.runner(false)

    const beginLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
      this.api,
      this.sudo,
      addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      this.workingGroup
    )
    await beginLeaderApplicationReviewFixture.runner(false)

    const fillLeaderOpeningFixture = new FillLeaderOpeningFixture(
      this.api,
      [this.leadKeyPair],
      this.sudo,
      addLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      this.firstRewardInterval,
      this.rewardInterval,
      this.payoutAmount,
      this.workingGroup
    )
    await fillLeaderOpeningFixture.runner(false)
  }
}
