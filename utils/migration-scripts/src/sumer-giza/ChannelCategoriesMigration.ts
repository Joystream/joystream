import { ChannelCategoryMetadata } from '@joystream/metadata-protobuf'
import { ChannelCategoryId } from '@joystream/types/content'
import { MigrationResult } from './BaseMigration'
import { CategoryMigration } from './CategoryMigration'

export class ChannelCategoriesMigration extends CategoryMigration {
  name = 'Channel categories migration'

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

    const result = await api.sendExtrinsic(this.sudo, api.tx.utility.batch(txs))
    const categoryCreatedEvents = api.findEvents(result, 'content', 'ChannelCategoryCreated')
    const createdCategoryIds: ChannelCategoryId[] = categoryCreatedEvents.map((e) => e.data[0])

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
    console.log(`Channel categories map created!`, this.idsMap.entries())
    if (this.failedMigrations.size) {
      throw new Error(`Failed to create some channel categories: ${Array.from(this.failedMigrations).join(', ')}`)
    }
    console.log(`All channel categories succesfully migrated!`)

    return this.getResult()
  }
}
