import ExitCodes from '../../command-base/ExitCodes'
import NodeCommandBase from '../../command-base/node'
import { flags } from '../../command-base/default'
import { SetBucketsOperation } from '../../types'
import { BucketIdParserService } from '../../services/parsers/BucketIdParserService'

export default class NodeSetBucketsCommand extends NodeCommandBase {
  static description = `Send an api request to change the set of buckets distributed by given distributor node.`

  static flags = {
    all: flags.boolean({
      char: 'a',
      description: 'Distribute all buckets belonging to configured worker',
      exclusive: ['bucketIds'],
    }),
    bucketIds: flags.bucketId({
      description:
        'Set of bucket ids to distribute. Each bucket id should be in {familyId}:{bucketIndex} format. ' +
        'Multiple ids can be provided, separated by space.',
      multiple: true,
    }),
    ...NodeCommandBase.flags,
  }

  static examples = [
    '$ joystream-distributor node:set-buckets --bucketIds 1:1 1:2 1:3 2:1 2:2',
    '$ joystream-distributor node:set-buckets --all',
  ]

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
    return all
      ? {}
      : {
          buckets: bucketIds.map((b) => BucketIdParserService.formatBucketId(b)),
        }
  }
}
