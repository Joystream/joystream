import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { DistributorCLI } from '../../cli/distributor'
import BN from 'bn.js'

export default async function initDistributionBucket({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initDistributionBucketViaCLI')
  debug('Started')

  const [leaderId, leader] = await api.getLeader('distributionWorkingGroup')

  const operatorId = leaderId.toString()
  const leaderSuri = api.getSuri(leader.roleAccountId)

  // Send some funds to pay fees
  const funds = new BN(5_000_000_000)
  await api.treasuryTransferBalance(leader.roleAccountId.toString(), funds)

  const cli = new DistributorCLI([leaderSuri])

  await cli.run('leader:set-buckets-per-bag-limit', ['--limit', '10'])
  const { out: familyId } = await cli.run('leader:create-bucket-family')
  const { out: bucketIndex } = await cli.run('leader:create-bucket', ['--familyId', familyId, '--acceptingBags', 'yes'])
  const bucketId = `${familyId}:${bucketIndex}`
  await cli.run('leader:update-bag', ['--bagId', 'static:council', '--familyId', familyId, '--add', bucketIndex])
  await cli.run('leader:update-dynamic-bag-policy', ['--type', 'Channel', '--policy', `${familyId}:1`])
  await cli.run('leader:update-bucket-mode', ['--bucketId', bucketId, '--mode', 'on'])
  await cli.run('leader:invite-bucket-operator', ['--bucketId', bucketId, '--workerId', operatorId])
  await cli.run('operator:accept-invitation', ['--bucketId', bucketId, '--workerId', operatorId])
  await cli.run('operator:set-metadata', [
    '--bucketId',
    bucketId,
    '--workerId',
    operatorId,
    '--endpoint',
    'http://localhost:3334',
  ])

  debug('Done')
}
