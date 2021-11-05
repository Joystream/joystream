import { VideoCategoryMetadata } from '@joystream/metadata-protobuf'
import { VideoCategoryId } from '@joystream/types/content'
import { MigrationResult } from './BaseMigration'
import { CategoryMigration } from './CategoryMigration'

export class VideoCategoriesMigration extends CategoryMigration {
  name = 'Video categories migration'
  public async run(): Promise<MigrationResult> {
    await this.init()
    const { api } = this
    const allCategories = await this.queryNodeApi.getVideoCategories()
    const categoriesToMigrate = allCategories.filter((c) => !this.idsMap.has(parseInt(c.id)))

    if (!categoriesToMigrate.length) {
      console.log('All video categories already migrated, skipping...')
      return this.getResult()
    }

    console.log(`Migrating ${categoriesToMigrate.length} video categories...`)
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

    const result = await api.sendExtrinsic(this.sudo, api.tx.utility.batch(txs))
    const categoryCreatedEvents = api.findEvents(result, 'content', 'VideoCategoryCreated')
    const createdCategoryIds: VideoCategoryId[] = categoryCreatedEvents.map((e) => e.data[1])

    if (createdCategoryIds.length !== categoriesToMigrate.length) {
      this.extractFailedSudoAsMigrations(result, categoriesToMigrate)
    }

    let newCategoryIndex = 0
    categoriesToMigrate.forEach((c) => {
      if (this.failedMigrations.has(parseInt(c.id))) {
        return
      }
      const newCategoryId = createdCategoryIds[newCategoryIndex++]
      this.idsMap.set(parseInt(c.id), newCategoryId.toNumber())
    })
    console.log(`Video categories map created!`, this.idsMap.entries())
    if (this.failedMigrations.size) {
      throw new Error(`Failed to create some video categories: ${Array.from(this.failedMigrations).join(', ')}`)
    }
    console.log(`All video categories succesfully migrated!`)
    return this.getResult()
  }
}
