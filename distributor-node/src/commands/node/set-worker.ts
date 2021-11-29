import { flags } from '@oclif/command'
import NodeCommandBase from '../../command-base/node'
import { SetWorkerOperation } from '../../types'

export default class NodeSetWorkerCommand extends NodeCommandBase {
  static description = `Send an api request to change workerId assigned to given distributor node instance.`

  static flags = {
    workerId: flags.integer({
      char: 'w',
      description: 'New workerId to set',
      required: true,
    }),
    ...NodeCommandBase.flags,
  }

  protected reqUrl(): string {
    return '/api/v1/set-worker'
  }

  protected reqBody(): SetWorkerOperation {
    const {
      flags: { workerId },
    } = this.parse(NodeSetWorkerCommand)
    return {
      workerId,
    }
  }
}
