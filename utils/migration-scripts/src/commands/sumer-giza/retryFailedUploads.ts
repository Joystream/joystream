import { Command, flags } from '@oclif/command'
import path from 'path'
import os from 'os'
import { WsProvider } from '@polkadot/rpc-provider'
import { RuntimeApi } from '../../RuntimeApi'
import { AssetsManager } from '../../sumer-giza/AssetsManager'

export class RetryFailedUploadsCommand extends Command {
  static flags = {
    wsProviderEndpointUri: flags.string({
      description: 'WS provider endpoint uri (Giza)',
      default: 'ws://localhost:9944',
    }),
    dataDir: flags.string({
      description: 'Directory where data objects to upload are stored',
      default: path.join(os.tmpdir(), 'joystream/sumer-giza-migration'),
    }),
    uploadSpEndpoint: flags.string({
      description: 'Giza storage node endpoint to use for uploading',
      default: 'http://localhost:3333',
    }),
    uploadSpBucketId: flags.integer({
      description: 'Giza storage bucket id',
      default: 0,
    }),
    failedUploadsPath: flags.string({
      char: 'f',
      description: 'Path to failed uploads file',
      required: true,
    }),
    logLevel: flags.string({
      char: 'l',
      description: 'Set log level: [error|warn|info|debug] [default: info]',
      default: process.env.DEBUG ? 'debug' : 'info',
    }),
  }

  async run(): Promise<void> {
    const opts = this.parse(RetryFailedUploadsCommand).flags
    try {
      const provider = new WsProvider(opts.wsProviderEndpointUri)
      const api = new RuntimeApi({ provider })
      await api.isReadyOrError
      const assetsManager = await AssetsManager.create({
        api,
        config: {
          ...opts,
          migrationStatePath: path.dirname(opts.failedUploadsPath),
        },
      })
      assetsManager.loadQueue(opts.failedUploadsPath)
      await assetsManager.processQueuedUploads()
    } catch (e) {
      console.error(e)
      this.exit(-1)
    }
    this.exit(0)
  }
}
