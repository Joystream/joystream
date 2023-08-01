import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { StorageCLI } from '../../cli/storage'
import BN from 'bn.js'

export default async function initStorageBucket({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initStorageBucketViaCLI')
  debug('Started')

  const [leaderId, leader] = await api.getLeader('storageWorkingGroup')

  const leaderSuri = api.getSuri(leader.roleAccountId)
  const transactorKey = '5DkE5YD8m5Yzno6EH2RTBnH268TDnnibZMEMjxwYemU4XevU' // //Colossus1

  const operatorId = leaderId.toString()
  // Send some funds to pay fees
  const funds = new BN(5_000_000_000)
  await api.treasuryTransferBalance(transactorKey, funds)
  await api.treasuryTransferBalance(leader.roleAccountId.toString(), funds)

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
  await cli.run('leader:update-bags', ['--add', bucketId, '--bagIds', 'static:council'])
  await cli.run('leader:update-dynamic-bag-policy', ['--bagType', 'Channel', '--number', '1'])
  await cli.run('operator:set-metadata', [
    '--bucketId',
    bucketId,
    '--workerId',
    operatorId,
    '--endpoint',
    'http://localhost:3333',
  ])
  await cli.run('leader:update-data-fee', ['-f', '0'])

  debug('Done')
}
