import { Command, flags } from '@oclif/command'
import path from 'path'
import os from 'os'
import { ContentMigration } from '../../sumer-giza/ContentMigration'

export class MigrateContentCommand extends Command {
  static flags = {
    queryNodeUri: flags.string({
      description: 'Query node uri',
      default: 'https://hydra.joystream.org/graphql',
    }),
    wsProviderEndpointUri: flags.string({
      description: 'WS provider endpoint uri (Giza)',
      default: 'ws://localhost:9944',
    }),
    sudoUri: flags.string({
      description: 'Sudo key Substrate uri',
      default: '//Alice',
    }),
    channelIds: flags.integer({
      char: 'c',
      multiple: true,
      description: 'Channel ids to migrate',
      required: true,
    }),
    dataDir: flags.string({
      description: 'Directory for storing data objects to upload',
      default: path.join(os.tmpdir(), 'joystream/sumer-giza-migration'),
    }),
    channelBatchSize: flags.integer({
      description: 'Channel batch size',
      default: 20,
    }),
    videoBatchSize: flags.integer({
      description: 'Video batch size',
      default: 20,
    }),
    dev: flags.boolean({
      description: 'Turns on dev mode (assumes that member 0 (Alice) exists)',
      default: false,
    }),
    preferredDownloadSpEndpoints: flags.string({
      multiple: true,
      description: 'Preferred storage node endpoints when downloading data objects (comma-separated)',
      default: ['https://rome-rpc-4.joystream.org'],
    }),
    uploadSpEndpoint: flags.string({
      description: 'Giza storage node endpoint to use for uploading',
      default: 'http://localhost:3333',
    }),
    uploadSpBucketId: flags.integer({
      description: 'Giza storage bucket id',
      default: 0,
    }),
    uploadMemberId: flags.integer({
      description: 'Giza member id to use for uploading',
      default: 0,
    }),
    uploadMemberControllerUri: flags.string({
      description: 'Giza upload member controller uri',
      default: '//Alice',
    }),
    migrationStatePath: flags.string({
      description: 'Path to migration results directory',
      default: path.join(__dirname, '../../../results/sumer-giza'),
    }),
  }

  async run(): Promise<void> {
    const opts = this.parse(MigrateContentCommand).flags
    try {
      const migration = new ContentMigration(opts)
      await migration.run()
    } catch (e) {
      console.error(e)
      this.exit(-1)
    }
    this.exit(0)
  }
}
