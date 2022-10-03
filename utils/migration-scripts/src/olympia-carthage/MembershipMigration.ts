import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { MembershipFieldsFragment } from './olympia-query-node/generated/queries'
import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/common'
import { BaseMigration, BaseMigrationConfig, BaseMigrationParams, MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipsSnapshot } from './SnapshotManager'

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
    const result = await api.sendExtrinsic(this.sudo, tx)
    // I doubt we need to sort, the event order will be in the same order as
    // calls in the batch
    const memberCreationEvents = result
      .filterRecords('members', ['MemberCreated', 'FoundingMemberCreated'])
      .map((r) => r.event)

    const newMemberIds: MemberId[] = memberCreationEvents.map((e) => e.data[0] as MemberId)

    if (newMemberIds.length !== members.length) {
      this.extractFailedMigrations(result, members, 1)
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
    // Make sure members are sorted by member id
    const sortedSnapshot = this.snapshot.members.sort((a, b) => parseInt(a.id) - parseInt(b.id))
    while ((membersBatch = sortedSnapshot.splice(0, batchSize)).length) {
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

    const createFoundingMemberParams = createType('PalletMembershipCreateMemberParameters', {
      handle,
      controllerAccount,
      rootAccount,
      metadata: `0x${Buffer.from(MembershipMetadata.encode(meta).finish()).toString('hex')}`,
      isFoundingMember,
    })
    return api.tx.sudo.sudo(api.tx.members.createMember(createFoundingMemberParams))
  }
}
