import { VideoCategoryMetadata } from '@joystream/metadata-protobuf'
import { VideoCategoryId } from '@joystream/types/content'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { BaseMigrationParams, MigrationResult } from './BaseMigration'
import { CategoryMigration } from './CategoryMigration'
import { ContentDirectorySnapshot } from './SnapshotManager'

export class VideoCategoriesMigration extends CategoryMigration {
  name = 'Video categories migration'
  protected logger: Logger

  public constructor(params: BaseMigrationParams<ContentDirectorySnapshot>) {
    super(params)
    this.logger = createLogger(this.name)
  }

  protected async migrateBatch(
    batchTx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    batch: { id: string }[]
  ): Promise<void> {
    const { api } = this
    const result = await api.sendExtrinsic(this.sudo, batchTx)
    const categoryCreatedEvents = api.findEvents(result, 'content', 'VideoCategoryCreated')
    const createdCategoryIds: VideoCategoryId[] = categoryCreatedEvents.map((e) => e.data[1])

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
    this.logger.info(`Video categories map created!`, this.idsMap.entries())
    if (this.failedMigrations.size) {
      throw new Error(`Failed to create some video categories: ${Array.from(this.failedMigrations).join(', ')}`)
    }
    this.logger.info(`All video categories succesfully migrated!`)
  }

  public async run(): Promise<MigrationResult> {
    await this.init()
    const { api } = this
    const allCategories = await this.snapshot.videoCategories
    const categoriesToMigrate = allCategories.filter((c) => !this.idsMap.has(parseInt(c.id)))

    if (!categoriesToMigrate.length) {
      this.logger.info('All video categories already migrated, skipping...')
      return this.getResult()
    }

    this.logger.info(`Migrating ${categoriesToMigrate.length} video categories...`)
    const txs = categoriesToMigrate
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .map((c) => {
        const meta = new VideoCategoryMetadata({ name: c.name })
        const metaBytes = '0x' + Buffer.from(VideoCategoryMetadata.encode(meta).finish()).toString('hex')
        return api.tx.sudo.sudoAs(
          this.contentLeadKey,
          api.tx.content.createVideoCategory('Lead', {
            meta: metaBytes,
          })
        )
      })

    const batchTx = api.tx.utility.batch(txs)
    await this.migrateBatch(batchTx, categoriesToMigrate)

    return this.getResult()
  }
}
