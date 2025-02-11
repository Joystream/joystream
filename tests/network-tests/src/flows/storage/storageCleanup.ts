import urljoin from 'url-join'
import { createType } from '@joystream/types'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { GenerateAssetsFixture } from '../../fixtures/storage/GenerateChannelAssetsFixture'
import { FixtureRunner } from '../../Fixture'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { doubleBucketConfig } from './initStorage'
import { createJoystreamCli } from '../utils'

export async function storageCleanup({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:storageCleanup')
  api.enableDebugTxLogs()
  debug('Started')

  // Get storage leader key
  const [, storageLeader] = await api.getLeader('storageWorkingGroup')
  const storageLeaderKey = storageLeader.roleAccountId.toString()

  // Generate channel assets
  const joystreamCli = await createJoystreamCli()
  const generateAssetsFixture = new GenerateAssetsFixture(api, query, joystreamCli, { numberOfChannels: 3 })
  await new FixtureRunner(generateAssetsFixture).runWithQueryNodeChecks()
  const channelsData = generateAssetsFixture.channelsCreated
  const channelIds = channelsData.map((c) => c.id)

  // Verify that both storage nodes store all the assets of created channels
  const colossus1Endpoint = doubleBucketConfig.buckets[0].metadata.endpoint
  const colossus2Endpoint = doubleBucketConfig.buckets[1].metadata.endpoint
  Utils.assert(colossus1Endpoint && colossus2Endpoint, 'Missing one of 2 colossus node endpoints!')

  const colossus1Api = new ColossusApi(urljoin(colossus1Endpoint, 'api/v1'))
  const colossus2Api = new ColossusApi(urljoin(colossus2Endpoint, 'api/v1'))

  await generateAssetsFixture.verifyAssets([
    { api: colossus1Api, channelIds },
    { api: colossus2Api, channelIds },
  ])
  debug('All assets correctly stored!')

  // Delete the 1st channel
  debug('Deleting 1st channel...')
  await joystreamCli.deleteChannel(channelIds[0])

  // Update 2nd channel bag to only be stored by colossus1 and
  // 3rd channel bag to only be stored by colossus2
  debug('Reassigning 2nd channel to colossus1 only and 3rd channel to colossus2 only...')
  const bag1Id = createType('PalletStorageBagIdType', { Dynamic: { Channel: channelIds[1] } }) // 2nd channel bag
  const bag2Id = createType('PalletStorageBagIdType', { Dynamic: { Channel: channelIds[2] } }) // 3rd channel bag
  const updateTxs = [
    api.tx.storage.updateStorageBucketsForBag(
      bag1Id,
      createType('BTreeSet<u64>', []),
      createType('BTreeSet<u64>', [1]) // Remove 1st bucket (colossus2)
    ),
    api.tx.storage.updateStorageBucketsForBag(
      bag2Id,
      createType('BTreeSet<u64>', []),
      createType('BTreeSet<u64>', [0]) // Remove 0th bucket (colossus1)
    ),
  ]
  await api.sendExtrinsicsAndGetResults(updateTxs, storageLeaderKey)

  // Verify that colossus1 only stores 2nd channel assets,
  // while colossus2 only stores 3rd channel assets
  await generateAssetsFixture.verifyAssets([
    { api: colossus1Api, channelIds: [channelIds[1]] },
    { api: colossus2Api, channelIds: [channelIds[2]] },
  ])
  debug('Cleanup correctly executed!')

  debug('Done')
}
