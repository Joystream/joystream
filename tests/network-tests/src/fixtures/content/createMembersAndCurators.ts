import { MemberId, WorkerId } from '@joystream/types/primitives'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Api } from '../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { BuyMembershipHappyCaseFixture } from '../membership'
import { HireWorkersFixture } from '../workingGroups/HireWorkersFixture'

export interface IMember {
  keyringPair: KeyringPair
  account: string
  memberId: MemberId
}

export interface IWorker {
  keyringPair: KeyringPair
  account: string
  memberId: MemberId
}

export class CreateMembersFixture extends BaseQueryNodeFixture {
  private memberCount: number
  private curatorCount: number
  private topupAmount: BN
  private createdItems: { members: IMember[]; curators: WorkerId[] }

  constructor(api: Api, query: QueryNodeApi, memberCount: number, curatorCount: number, topupAmount: BN) {
    super(api, query)
    this.memberCount = memberCount
    this.curatorCount = curatorCount
    this.topupAmount = topupAmount
    this.createdItems = {
      members: [],
      curators: [],
    }
  }

  public getCreatedItems() {
    return this.createdItems
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    if (this.memberCount) {
      this.debug('Creating member')
      this.createdItems.members = await this.createMembers(this.memberCount)
    }

    if (this.curatorCount) {
      this.debug('Creating Curators')
      this.createdItems.curators = await this.createCurators(this.curatorCount)
    }

    this.debug('Top-uping accounts')
    await this.api.treasuryTransferBalanceToAccounts(
      this.createdItems.members.map((item) => item.keyringPair.address),
      this.topupAmount
    )
  }

  /**
    Creates new accounts and registers memberships for them.
  */
  private async createMembers(numberOfMembers: number): Promise<IMember[]> {
    const keyringPairs = (await this.api.createKeyPairs(numberOfMembers)).map((kp) => kp.key)
    const accounts = keyringPairs.map((item) => item.address)
    const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(this.api, this.query, accounts)

    await new FixtureRunner(buyMembershipsFixture).run()

    const memberIds = buyMembershipsFixture.getCreatedMembers()

    return keyringPairs.map((item, index) => ({
      keyringPair: item,
      account: accounts[index],
      memberId: memberIds[index],
    }))
  }

  /**
    Creates new workers in the content working group
  */
  public async createCurators(numberOfCurators: number): Promise<WorkerId[]> {
    const createCuratorsFixtures = new HireWorkersFixture(this.api, this.query, 'contentWorkingGroup', numberOfCurators)

    await new FixtureRunner(createCuratorsFixtures).run()
    const curatorIds = createCuratorsFixtures.getCreatedWorkerIds()
    return curatorIds
  }
}
