import { ChannelCategoryMetadata } from '@joystream/metadata-protobuf'
import { ChannelCategoryId } from '@joystream/types/content'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { BaseMigrationParams, MigrationResult } from './BaseMigration'
import { CategoryMigration } from './CategoryMigration'

export class ChannelCategoriesMigration extends CategoryMigration {
  name = 'Channel categories migration'
  protected logger: Logger

  public constructor(params: BaseMigrationParams) {
    super(params)
    this.logger = createLogger(this.name)
  }

  protected async migrateBatch(
    batchTx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    batch: { id: string }[]
  ): Promise<void> {
    const { api } = this
    const result = await api.sendExtrinsic(this.sudo, batchTx)
    const categoryCreatedEvents = api.findEvents(result, 'content', 'ChannelCategoryCreated')
    const createdCategoryIds: ChannelCategoryId[] = categoryCreatedEvents.map((e) => e.data[0])

    if (createdCategoryIds.length !== batch.length) {
      this.extractFailedMigrations(result, batch)
    }

    let newCategoryIndex = 0
    batch.forEach((c) => {
      if (this.failedMigrations.has(parseInt(c.id))) {
        return
      }
      const newCategoryId = createdCategoryIds[newCategoryIndex++]
      this.idsMap.set(parseInt(c.id), newCategoryId.toNumber())
    })
    console.log(`Channel categories map created!`, this.idsMap.entries())
    if (this.failedMigrations.size) {
      throw new Error(`Failed to create some channel categories: ${Array.from(this.failedMigrations).join(', ')}`)
    }
    console.log(`All channel categories succesfully migrated!`)
  }

  public async run(): Promise<MigrationResult> {
    await this.init()
    const { api } = this
    const allCategories = await this.queryNodeApi.getChannelCategories()
    const categoriesToMigrate = allCategories.filter((c) => !this.idsMap.has(parseInt(c.id)))

    if (!categoriesToMigrate.length) {
      console.log('All channel categories already migrated, skipping...')
      return this.getResult()
    }

    console.log(`Migrating ${categoriesToMigrate.length} channel categories...`)
    const txs = categoriesToMigrate
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .map((c) => {
        const meta = new ChannelCategoryMetadata({ name: c.name })
        const metaBytes = '0x' + Buffer.from(ChannelCategoryMetadata.encode(meta).finish()).toString('hex')
        return api.tx.sudo.sudoAs(
          this.contentLeadKey,
          api.tx.content.createChannelCategory('Lead', {
            meta: metaBytes,
          })
        )
      })

    const batchTx = api.tx.utility.batch(txs)
    await this.migrateBatch(batchTx, categoriesToMigrate)

    return this.getResult()
  }
}
