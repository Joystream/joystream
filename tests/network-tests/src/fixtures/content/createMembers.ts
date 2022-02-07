import { Debugger, extendDebug } from '../../Debugger'
import { QueryNodeApi } from '../../QueryNodeApi'
import { PaidTermId, MemberId } from '@joystream/types/members'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { Api } from '../../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { BuyMembershipHappyCaseFixture } from '../membershipModule'

export interface IMember {
  keyringPair: KeyringPair
  account: string
  memberId: MemberId
}

export class CreateMembersFixture extends BaseQueryNodeFixture {
  private debug: Debugger.Debugger
  private paidTerms: PaidTermId
  private memberCount: number
  private topupAmount: BN
  private createdItems: IMember[] = []

  constructor(api: Api, query: QueryNodeApi, paidTerms: PaidTermId, memberCount: number, topupAmount: BN) {
    super(api, query)
    this.paidTerms = paidTerms
    this.memberCount = memberCount
    this.topupAmount = topupAmount
    this.debug = extendDebug('fixture:NftAuctionFixture')
  }

  public getCreatedItems() {
    return this.createdItems
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Creating member')
    this.createdItems = await this.createMembers(this.memberCount)

    this.debug('Top-uping accounts')
    await this.api.treasuryTransferBalanceToAccounts(
      this.createdItems.map((item) => item.keyringPair.address),
      this.topupAmount
    )
  }

  /**
    Creates new accounts and registers memberships for them.
  */
  private async createMembers(numberOfMembers: number): Promise<IMember[]> {
    const keyringPairs = (await this.api.createKeyPairs(numberOfMembers)).map((kp) => kp.key)
    const accounts = keyringPairs.map((item) => item.address)
    const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(this.api, accounts, this.paidTerms)

    await new FixtureRunner(buyMembershipsFixture).run()

    const memberIds = buyMembershipsFixture.getCreatedMembers()

    return keyringPairs.map((item, index) => ({
      keyringPair: item,
      account: accounts[index],
      memberId: memberIds[index],
    }))
  }
}
