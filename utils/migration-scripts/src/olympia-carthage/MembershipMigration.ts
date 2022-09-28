import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { MembershipFieldsFragment } from './olympia-query-node/generated/queries'
import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/common'
import { BaseMigration, BaseMigrationConfig, BaseMigrationParams, MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipsSnapshot } from './SnapshotManager'
import BN from 'bn.js'

export type MembershipMigrationConfig = BaseMigrationConfig & {
  batchSize: number
}

export type FoundingMembers = Array<number>

export type MembershipMigrationParams = BaseMigrationParams<MembershipsSnapshot> & {
  config: MembershipMigrationConfig
  foundingMembers: FoundingMembers
}

export class MembershipMigration extends BaseMigration<MembershipsSnapshot> {
  name = 'Membership migration'
  protected config: MembershipMigrationConfig
  protected logger: Logger
  protected foundingMembers: FoundingMembers

  public constructor(params: MembershipMigrationParams) {
    super(params)
    this.config = params.config
    this.logger = createLogger(this.name)
    this.foundingMembers = params.foundingMembers.slice()
  }

  protected async migrateBatch(
    tx: SubmittableExtrinsic<'promise'>,
    members: MembershipFieldsFragment[]
  ): Promise<void> {
    const { api } = this
    // we use sudo to bypass the system call filter present in initial deployment stage
    const result = await api.sendExtrinsic(this.sudo, tx)
    const indexedMembershipBoughtId = api
      .findEvents(result, 'members', 'MembershipBought')
      .map((e) => ({ index: e.index, id: e.data[0] }))
    const indexedFoundingMemberCreatedIds = api
      .findEvents(result, 'members', 'FoundingMemberCreated')
      .map((e) => ({ index: e.index, id: e.data[0] }))
    const allIds = indexedMembershipBoughtId.concat(indexedFoundingMemberCreatedIds)
    // Ids sorted as per emitted events order
    const sortedIds = allIds.sort((a, b) => new BN(a.index).cmp(new BN(b.index)))

    const newMemberIds: MemberId[] = sortedIds.map((e) => e.id)

    if (allIds.length !== members.length) {
      this.extractFailedMigrations(result, members, 1, false)
    }
    const newMembersMapEntries: [number, number][] = []
    let newMemberIdIndex = 0
    members.forEach(({ id }) => {
      if (this.failedMigrations.has(parseInt(id))) {
        return
      }
      const newMemberId = newMemberIds[newMemberIdIndex++].toNumber()
      this.idsMap.set(parseInt(id), newMemberId)
      newMembersMapEntries.push([parseInt(id), newMemberId])
    })
    if (newMembersMapEntries.length) {
      this.logger.info('Members map entries added!', { newMembersMapEntries })
    }
  }

  public async run(): Promise<MigrationResult> {
    await this.init()
    const {
      api,
      config: { batchSize },
    } = this
    let membersBatch: MembershipFieldsFragment[] = []
    while ((membersBatch = this.snapshot.members.splice(0, batchSize)).length) {
      this.logger.info(`Preparing a batch of ${membersBatch.length} members...`)
      const membersToMigrate = membersBatch.filter((m) => !this.idsMap.has(parseInt(m.id)))
      if (membersToMigrate.length < membersBatch.length) {
        this.logger.info(
          `${membersToMigrate.length ? 'Some' : 'All'} members in this batch were already migrated ` +
            `(${membersBatch.length - membersToMigrate.length}/${membersBatch.length})`
        )
      }
      if (membersToMigrate.length) {
        const calls = await Promise.all(membersToMigrate.map((m) => this.prepareMember(m)))
        const batchTx = api.tx.utility.batch(calls)
        await this.executeBatchMigration(batchTx, membersToMigrate)
      }
    }
    return this.getResult()
  }

  private async prepareMember(member: MembershipFieldsFragment) {
    const { api } = this
    const { handle, rootAccount, controllerAccount, metadata, id } = member
    const { name, about, avatar } = metadata

    const meta = new MembershipMetadata({
      about,
      name,
    })

    if (avatar && avatar.avatarUri) {
      meta.avatarUri = avatar.avatarUri
    }

    const isFoundingMember = this.foundingMembers.indexOf(parseInt(id)) !== -1

    if (isFoundingMember) {
      const createFoundingMemberParams = createType('PalletMembershipCreateFoundingMemberParameters', {
        handle,
        controllerAccount,
        rootAccount,
        metadata: `0x${Buffer.from(MembershipMetadata.encode(meta).finish()).toString('hex')}`,
      })
      return api.tx.sudo.sudo(api.tx.members.createFoundingMember(createFoundingMemberParams))
    } else {
      const buyMembershipParams = createType('PalletMembershipBuyMembershipParameters', {
        handle,
        controllerAccount,
        rootAccount,
        referrerId: null,
        metadata: `0x${Buffer.from(MembershipMetadata.encode(meta).finish()).toString('hex')}`,
      })
      return api.tx.sudo.sudoAs(this.sudo.address, api.tx.members.buyMembership(buyMembershipParams))
    }
  }
}
