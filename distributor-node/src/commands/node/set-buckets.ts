import { flags } from '@oclif/command'
import ExitCodes from '../../command-base/ExitCodes'
import NodeCommandBase from '../../command-base/node'
import { SetBucketsOperation } from '../../types'

export default class NodeSetBucketsCommand extends NodeCommandBase {
  static description = `Send an api request to change the set of buckets distributed by given distributor node.`

  static flags = {
    all: flags.boolean({
      char: 'a',
      description: 'Distribute all buckets belonging to configured worker',
      exclusive: ['bucketIds'],
    }),
    bucketIds: flags.integer({
      char: 'B',
      description: 'Set of bucket ids to distribute',
      exclusive: ['all'],
      multiple: true,
    }),
    ...NodeCommandBase.flags,
  }

  protected reqUrl(): string {
    return '/api/v1/set-buckets'
  }

  protected reqBody(): SetBucketsOperation {
    const {
      flags: { all, bucketIds },
    } = this.parse(NodeSetBucketsCommand)
    if (!all && !bucketIds) {
      this.error('You must provide either --bucketIds or --all flag!', { exit: ExitCodes.InvalidInput })
    }
    return {
      buckets: all ? 'all' : bucketIds,
    }
  }
}
