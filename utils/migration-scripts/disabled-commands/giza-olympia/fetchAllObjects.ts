import { Command, flags } from '@oclif/command'
import path from 'path'
import os from 'os'
import { QueryNodeApi } from '../../giza-olympia/giza-query-node/api'
import { DownloadManager } from '../../giza-olympia/DownloadManager'

export class FetchAllObjectsCommand extends Command {
  static flags = {
    queryNodeUri: flags.string({
      description: 'Giza query node uri',
      default: 'https://hydra.joystream.org/graphql',
    }),
    dataDir: flags.string({
      description: 'Directory for storing data objects',
      default: path.join(os.tmpdir(), 'joystream/giza-olympia-migration'),
    }),
    continously: flags.boolean({
      description: 'Whether the script should run continously',
      default: true,
    }),
    objectsPerBatch: flags.integer({
      required: false,
      description: 'Max. number of storage objects to fetch simultaneously',
      default: 20,
    }),
    idleTime: flags.integer({
      required: false,
      description: 'Time (in seconds) to remain idle in case no new data objects were found',
      default: 300,
      dependsOn: ['continously'],
    }),
  }

  async run(): Promise<void> {
    const opts = this.parse(FetchAllObjectsCommand).flags
    const queryNodeApi = new QueryNodeApi(opts.queryNodeUri)

    const downloadManager = new DownloadManager({ queryNodeApi, config: opts })
    await downloadManager.fetchAllDataObjects(undefined, opts.continously, opts.idleTime)
    this.exit(0)
  }
}
