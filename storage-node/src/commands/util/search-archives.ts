import { Command, flags } from '@oclif/command'
import { customFlags } from '../../command-base/CustomFlags'
import { ArchivesTrackingService } from '../../services/archive/tracking'
import path from 'path'

/**
 * CLI command:
 * Searches for the archive file names given an archive trackfile and a list of data objects of interest.
 *
 * @remarks
 * Shell command: "util:search-archives"
 */
export default class SearchArchives extends Command {
  static description =
    'Searches for the archive file names given an archive trackfile and a list of data objects of interest.'

  static flags = {
    archiveTrackfile: flags.string({
      char: 'f',
      description: 'Path to the archive trackfile (jsonl)',
      required: true,
    }),
    dataObjects: customFlags.integerArr({
      char: 'o',
      description: 'List of the data object ids to look for (comma-separated)',
      required: true,
    }),
    json: flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      required: false,
    }),
    nameOnly: flags.boolean({
      char: 'n',
      description: 'Output only the archive names',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(SearchArchives)

    const archiveTrackingService = new ArchivesTrackingService(
      path.dirname(flags.archiveTrackfile),
      path.basename(flags.archiveTrackfile)
    )

    const results = await archiveTrackingService.findDataObjects(flags.dataObjects.map((id) => id.toString()))

    if (flags.json) {
      if (flags.nameOnly) {
        this.log(
          JSON.stringify(
            results.hits.map((hit) => hit.name),
            null,
            2
          )
        )
      } else {
        this.log(JSON.stringify(results, null, 2))
      }
    } else if (flags.nameOnly) {
      this.log(results.hits.map((hit) => hit.name).join('\n'))
    } else {
      this.log('')
      const objectsFound = flags.dataObjects.length - results.missingObjects.length
      if (objectsFound > 0) {
        this.log(
          `Found ${objectsFound} out of ${flags.dataObjects.length} objects in ${results.hits.length} archive(s):`
        )
        for (const hit of results.hits) {
          this.log(
            `\n    ${hit.name}\n        ${hit.foundObjects.length} objects\n        ${hit.foundObjects.join(', ')}\n`
          )
        }
      }
      if (results.missingObjects.length > 0) {
        this.warn(`${results.missingObjects.length} objects could not be found: ${results.missingObjects.join(', ')}`)
      }
      this.log('')
    }
  }
}
