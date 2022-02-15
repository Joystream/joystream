import { Command, flags } from '@oclif/command'
import path from 'path'
import os from 'os'
import { ContentMigration } from '../../giza-olympia/ContentMigration'

export class MigrateContentCommand extends Command {
  static flags = {
    snapshotFilePath: flags.string({
      required: true,
      description: 'Path to giza content directory snapshot (json)',
    }),
    wsProviderEndpointUri: flags.string({
      description: 'WS provider endpoint uri (Olympia)',
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
      required: true,
      description: 'Directory where data objects to upload are stored',
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
    uploadSpEndpoint: flags.string({
      description: 'Olympia storage node endpoint to use for uploading',
      default: 'http://localhost:3333',
    }),
    uploadSpBucketId: flags.integer({
      description: 'Olympia storage bucket id',
      default: 0,
    }),
    migrationStatePath: flags.string({
      description: 'Path to migration results directory',
      default: path.join(__dirname, '../../../results/giza-olympia'),
    }),
    excludeVideoIds: flags.integer({
      multiple: true,
      description: 'Video ids to exclude from migration',
      required: false,
      default: [],
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
