import { Command, flags } from '@oclif/command'
import { writeFileSync } from 'fs'
import { QueryNodeApi } from '../../giza-olympia/giza-query-node/api'
import { SnapshotManager } from '../../giza-olympia/SnapshotManager'

export class CreateContentDirectorySnapshotCommand extends Command {
  static flags = {
    queryNodeUri: flags.string({
      description: 'Giza query node uri',
      default: 'https://hydra.joystream.org/graphql',
    }),
    output: flags.string({
      char: 'o',
      required: false,
      description: 'Output file path',
    }),
  }

  async run(): Promise<void> {
    const { queryNodeUri, output } = this.parse(CreateContentDirectorySnapshotCommand).flags
    const queryNodeApi = new QueryNodeApi(queryNodeUri)

    const snapshotManager = new SnapshotManager({ queryNodeApi })
    const snapshot = await snapshotManager.createContentDirectorySnapshot()
    if (output) {
      writeFileSync(output, JSON.stringify(snapshot, null, 2))
    } else {
      this.log(JSON.stringify(snapshot, null, 2))
    }
    this.exit(0)
  }
}
