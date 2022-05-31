import { Command, flags } from '@oclif/command'
import { WsProvider } from '@polkadot/api'
import { readFileSync } from 'fs'
import path from 'path'
import { MembershipMigration } from '../../giza-olympia/MembershipMigration'
import { MembershipsSnapshot } from '../../giza-olympia/SnapshotManager'
import { RuntimeApi } from '../../RuntimeApi'

export class MigrateMembersCommand extends Command {
  static flags = {
    snapshotFilePath: flags.string({
      required: true,
      description: 'Path to giza memberships snapshot (json)',
    }),
    wsProviderEndpointUri: flags.string({
      description: 'WS provider endpoint uri (Olympia)',
      default: 'ws://localhost:9944',
    }),
    sudoUri: flags.string({
      description: 'Sudo key Substrate uri',
      default: '//Alice',
    }),
    batchSize: flags.integer({
      description: 'Members batch size',
      default: 100,
    }),
    migrationStatePath: flags.string({
      description: 'Path to migration results directory',
      default: path.join(__dirname, '../../../results/giza-olympia'),
    }),
  }

  async run(): Promise<void> {
    const opts = this.parse(MigrateMembersCommand).flags
    try {
      const api = new RuntimeApi({ provider: new WsProvider(opts.wsProviderEndpointUri) })
      await api.isReadyOrError
      const snapshot = JSON.parse(readFileSync(opts.snapshotFilePath).toString()) as MembershipsSnapshot
      const migration = new MembershipMigration({
        api,
        snapshot,
        config: opts,
      })
      await migration.run()
    } catch (e) {
      console.error(e)
      this.exit(-1)
    }
    this.exit(0)
  }
}
