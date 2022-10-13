import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { MembershipFieldsFragment } from './giza-query-node/generated/queries'
import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/common'
import { BaseMigration, BaseMigrationConfig, BaseMigrationParams, MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { MembershipsSnapshot } from './SnapshotManager'
import { BuyMembershipParameters } from '@joystream/types/members'

export type MembershipMigrationConfig = BaseMigrationConfig & {
  batchSize: number
}

export type MembershipMigrationParams = BaseMigrationParams<MembershipsSnapshot> & {
  config: MembershipMigrationConfig
}

export class MembershipMigration extends BaseMigration<MembershipsSnapshot> {
  name = 'Membership migration'
  protected config: MembershipMigrationConfig
  protected logger: Logger

  public constructor(params: MembershipMigrationParams) {
    super(params)
    this.config = params.config
    this.logger = createLogger(this.name)
  }

  protected async migrateBatch(
    tx: SubmittableExtrinsic<'promise'>,
    members: MembershipFieldsFragment[]
  ): Promise<void> {
    const { api } = this
    const result = await api.sendExtrinsic(this.sudo, tx)
    const membershipBoughtEvents = api.findEvents(result, 'members', 'MembershipBought')
    const newMemberIds: MemberId[] = membershipBoughtEvents.map((e) => e.data[0])
    if (membershipBoughtEvents.length !== members.length) {
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
    const { handle, rootAccount, controllerAccount, about, avatarUri } = member

    const meta = new MembershipMetadata({
      about,
      avatarUri,
    })
    const buyMembershipParams = createType<BuyMembershipParameters, 'BuyMembershipParameters'>(
      'BuyMembershipParameters',
      {
        handle,
        controller_account: controllerAccount,
        root_account: rootAccount,
        metadata: `0x${Buffer.from(MembershipMetadata.encode(meta).finish()).toString('hex')}`,
      }
    )

    return api.tx.members.buyMembership(buyMembershipParams)
  }
}
