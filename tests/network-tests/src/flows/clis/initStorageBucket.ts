import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { WorkingGroups } from '../../WorkingGroups'
import { StorageCLI } from '../../cli/storage'

export default async function initStorageBucket({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initStorageBucketViaCLI')
  debug('Started')

  const leaderId = await api.getLeadWorkerId(WorkingGroups.Storage)
  const leader = await api.getGroupLead(WorkingGroups.Storage)
  if (!leaderId || !leader) {
    throw new Error('Active storage leader is required in this flow!')
  }
  const leaderSuri = api.getSuri(leader.role_account_id)
  const transactorKey = '5DkE5YD8m5Yzno6EH2RTBnH268TDnnibZMEMjxwYemU4XevU' // //Colossus1

  const operatorId = leaderId.toString()

  const cli = new StorageCLI(leaderSuri)
  await cli.run('leader:update-bag-limit', ['--limit', '10'])
  await cli.run('leader:update-voucher-limits', ['--objects', '1000', '--size', '10000000000'])
  const { out: bucketId } = await cli.run('leader:create-bucket', [
    '--invited',
    operatorId,
    '--allow',
    '--number',
    '1000',
    '--size',
    '10000000000',
  ])
  await cli.run('operator:accept-invitation', [
    '--workerId',
    operatorId,
    '--bucketId',
    bucketId,
    '--transactorAccountId',
    transactorKey,
  ])
  await cli.run('leader:update-bag', ['--add', bucketId, '--bagId', 'static:council'])
  await cli.run('leader:update-dynamic-bag-policy', ['--bagType', 'Channel', '--number', '1'])
  await cli.run('operator:set-metadata', [
    '--bucketId',
    bucketId,
    '--operatorId',
    operatorId,
    '--endpoint',
    'http://localhost:3333',
  ])

  debug('Done')
}
