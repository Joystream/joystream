import { Command, flags } from '@oclif/command'
import { writeFileSync } from 'fs'
import { QueryNodeApi } from '../../olympia-carthage/olympia-query-node/api'
import { SnapshotManager } from '../../olympia-carthage/SnapshotManager'

export class CreateMembershipsSnapshotCommand extends Command {
  static flags = {
    queryNodeUri: flags.string({
      description: 'Olympia query node uri',
      default: 'https://query.joystream.org/graphql',
    }),
    output: flags.string({
      char: 'o',
      required: false,
      description: 'Output file path',
    }),
  }

  async run(): Promise<void> {
    const { queryNodeUri, output } = this.parse(CreateMembershipsSnapshotCommand).flags
    const queryNodeApi = new QueryNodeApi(queryNodeUri)

    const snapshotManager = new SnapshotManager({ queryNodeApi })
    const snapshot = await snapshotManager.createMembershipsSnapshot()
    if (output) {
      writeFileSync(output, JSON.stringify(snapshot, null, 2))
    } else {
      this.log(JSON.stringify(snapshot, null, 2))
    }
    this.exit(0)
  }
}
