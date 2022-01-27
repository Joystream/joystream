import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { WorkingGroups } from '../../WorkingGroups'
import { DistributorCLI } from '../../cli/distributor'

export default async function initDistributionBucket({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initDistributionBucketViaCLI')
  debug('Started')

  const leaderId = await api.getLeadWorkerId(WorkingGroups.Distribution)
  const leader = await api.getGroupLead(WorkingGroups.Distribution)
  if (!leaderId || !leader) {
    throw new Error('Active distribution leader is required in this flow!')
  }
  const operatorId = leaderId.toString()
  const leaderSuri = api.getSuri(leader.role_account_id)

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
