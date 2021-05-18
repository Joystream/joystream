import BN from 'bn.js'
import { Api } from '../../Api'
import { assert } from 'chai'
import { QueryNodeApi } from '../../QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BaseQueryNodeFixture } from '../../Fixture'
import { AnyQueryNodeEvent, EventDetails, MembershipEventName } from '../../types'
import { MembershipSystemSnapshotFieldsFragment } from '../../graphql/generated/queries'

type MembershipSystemValues = {
  referralCut: number
  defaultInviteCount: number
  membershipPrice: BN
  invitedInitialBalance: BN
}

export class SudoUpdateMembershipSystem extends BaseQueryNodeFixture {
  private newValues: Partial<MembershipSystemValues>

  private events: EventDetails[] = []
  private eventNames: MembershipEventName[] = []
  private extrinsics: SubmittableExtrinsic<'promise'>[] = []

  public constructor(api: Api, query: QueryNodeApi, newValues: Partial<MembershipSystemValues>) {
    super(api, query)
    this.newValues = newValues
  }

  private async getMembershipSystemValuesAt(blockNumber: number): Promise<MembershipSystemValues> {
    const blockHash = await this.api.getBlockHash(blockNumber)
    return {
      referralCut: (await this.api.query.members.referralCut.at(blockHash)).toNumber(),
      defaultInviteCount: (await this.api.query.members.initialInvitationCount.at(blockHash)).toNumber(),
      invitedInitialBalance: await this.api.query.members.initialInvitationBalance.at(blockHash),
      membershipPrice: await this.api.query.members.membershipPrice.at(blockHash),
    }
  }

  private async assertBeforeSnapshotIsValid(beforeSnapshot: MembershipSystemSnapshotFieldsFragment) {
    assert.isNumber(beforeSnapshot.snapshotBlock)
    const chainValues = await this.getMembershipSystemValuesAt(beforeSnapshot.snapshotBlock)
    assert.equal(beforeSnapshot.referralCut, chainValues.referralCut)
    assert.equal(beforeSnapshot.invitedInitialBalance, chainValues.invitedInitialBalance.toString())
    assert.equal(beforeSnapshot.membershipPrice, chainValues.membershipPrice.toString())
    assert.equal(beforeSnapshot.defaultInviteCount, chainValues.defaultInviteCount)
  }

  private assertAfterSnapshotIsValid(
    beforeSnapshot: MembershipSystemSnapshotFieldsFragment,
    afterSnapshot: MembershipSystemSnapshotFieldsFragment
  ) {
    const { newValues } = this
    const expectedValue = (field: keyof MembershipSystemValues) => {
      const newValue = newValues[field]
      return newValue === undefined ? beforeSnapshot[field] : newValue instanceof BN ? newValue.toString() : newValue
    }
    assert.equal(afterSnapshot.referralCut, expectedValue('referralCut'))
    assert.equal(afterSnapshot.invitedInitialBalance, expectedValue('invitedInitialBalance'))
    assert.equal(afterSnapshot.membershipPrice, expectedValue('membershipPrice'))
    assert.equal(afterSnapshot.defaultInviteCount, expectedValue('defaultInviteCount'))
  }

  private checkEvent<T extends AnyQueryNodeEvent>(qEvent: T | null, txHash: string): T {
    if (!qEvent) {
      throw new Error('Missing query-node event')
    }
    assert.equal(qEvent.inExtrinsic, txHash)
    return qEvent
  }

  async execute(): Promise<void> {
    if (this.newValues.referralCut !== undefined) {
      this.extrinsics.push(this.api.tx.sudo.sudo(this.api.tx.members.setReferralCut(this.newValues.referralCut)))
      this.eventNames.push('ReferralCutUpdated')
    }
    if (this.newValues.defaultInviteCount !== undefined) {
      this.extrinsics.push(
        this.api.tx.sudo.sudo(this.api.tx.members.setInitialInvitationCount(this.newValues.defaultInviteCount))
      )
      this.eventNames.push('InitialInvitationCountUpdated')
    }
    if (this.newValues.membershipPrice !== undefined) {
      this.extrinsics.push(
        this.api.tx.sudo.sudo(this.api.tx.members.setMembershipPrice(this.newValues.membershipPrice))
      )
      this.eventNames.push('MembershipPriceUpdated')
    }
    if (this.newValues.invitedInitialBalance !== undefined) {
      this.extrinsics.push(
        this.api.tx.sudo.sudo(this.api.tx.members.setInitialInvitationBalance(this.newValues.invitedInitialBalance))
      )
      this.eventNames.push('InitialInvitationBalanceUpdated')
    }

    // We don't use api.makeSudoCall, since we cannot(?) then access tx hashes
    const sudo = await this.api.query.sudo.key()
    const results = await Promise.all(this.extrinsics.map((tx) => this.api.signAndSend(tx, sudo)))
    this.events = await Promise.all(
      results.map((r, i) => this.api.retrieveMembershipEventDetails(r, this.eventNames[i]))
    )
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const { events, extrinsics, eventNames } = this
    const afterSnapshotBlockTimestamp = Math.max(...events.map((e) => e.blockTimestamp))

    // Fetch "afterSnapshot" first to make sure query node has progressed enough
    const afterSnapshot = (await this.query.tryQueryWithTimeout(
      () => this.query.getMembershipSystemSnapshotAt(afterSnapshotBlockTimestamp),
      (snapshot) => assert.isOk(snapshot)
    )) as MembershipSystemSnapshotFieldsFragment

    const beforeSnapshot = await this.query.getMembershipSystemSnapshotBefore(afterSnapshotBlockTimestamp)

    if (!beforeSnapshot) {
      throw new Error(`Query node: MembershipSystemSnapshot before timestamp ${afterSnapshotBlockTimestamp} not found!`)
    }

    // Validate snapshots
    await this.assertBeforeSnapshotIsValid(beforeSnapshot)
    this.assertAfterSnapshotIsValid(beforeSnapshot, afterSnapshot)

    // Check events
    await Promise.all(
      events.map(async (event, i) => {
        const tx = extrinsics[i]
        const eventName = eventNames[i]
        const txHash = tx.hash.toString()
        const { blockNumber, indexInBlock } = event
        if (eventName === 'ReferralCutUpdated') {
          const { newValue } = this.checkEvent(
            await this.query.getReferralCutUpdatedEvent(blockNumber, indexInBlock),
            txHash
          )
          assert.equal(newValue, this.newValues.referralCut)
        }
        if (eventName === 'MembershipPriceUpdated') {
          const { newPrice } = this.checkEvent(
            await this.query.getMembershipPriceUpdatedEvent(blockNumber, indexInBlock),
            txHash
          )
          assert.equal(newPrice, this.newValues.membershipPrice!.toString())
        }
        if (eventName === 'InitialInvitationBalanceUpdated') {
          const { newInitialBalance } = this.checkEvent(
            await this.query.getInitialInvitationBalanceUpdatedEvent(blockNumber, indexInBlock),
            txHash
          )
          assert.equal(newInitialBalance, this.newValues.invitedInitialBalance!.toString())
        }
        if (eventName === 'InitialInvitationCountUpdated') {
          const { newInitialInvitationCount } = this.checkEvent(
            await this.query.getInitialInvitationCountUpdatedEvent(blockNumber, indexInBlock),
            txHash
          )
          assert.equal(newInitialInvitationCount, this.newValues.defaultInviteCount)
        }
      })
    )
  }
}
