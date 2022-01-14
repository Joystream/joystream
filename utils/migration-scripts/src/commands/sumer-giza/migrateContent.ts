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
    senderUri: flags.string({
      description: '(Sudo) key Substrate uri. If not sudo, membership is required.',
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
    forceChannelOwnerMemberId: flags.integer({
      description:
        'Can be used to force a specific channel owner for all channels, allowing to easily test the script in dev environment',
      required: false,
    }),
    preferredDownloadSpEndpoints: flags.string({
      multiple: true,
      description: 'Preferred storage node endpoints when downloading data objects',
      default: ['https://storage-1.joystream.org/storage'],
    }),
    uploadSpEndpoint: flags.string({
      description: 'Giza storage node endpoint to use for uploading',
      default: 'http://localhost:3333',
    }),
    uploadSpBucketId: flags.integer({
      description: 'Giza storage bucket id',
      default: 0,
    }),
    migrationStatePath: flags.string({
      description: 'Path to migration results directory',
      default: path.join(__dirname, '../../../results/sumer-giza'),
    }),
    excludeVideoIds: flags.integer({
      multiple: true,
      description: 'Video ids to exclude from migration',
      required: false,
      default: [],
    }),
    logLevel: flags.string({
      char: 'l',
      description: 'Set log level: [error|warn|info|debug] [default: info]',
      default: process.env.DEBUG ? 'debug' : 'info',
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
