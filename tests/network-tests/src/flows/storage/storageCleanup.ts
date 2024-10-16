import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { FixtureRunner } from '../../Fixture'
import { createType } from '@joystream/types'
import { ChannelCreationInputParameters } from '@joystream/cli/src/Types'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { doubleBucketConfig } from './initStorage'
import { readFileSync } from 'fs'
import { createJoystreamCli } from '../utils'
import urljoin from 'url-join'

export async function storageCleanup({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:storageCleanup')
  api.enableDebugTxLogs()
  debug('Started')

  // Get sotrage leader key
  const [, storageLeader] = await api.getLeader('storageWorkingGroup')
  const storageLeaderKey = storageLeader.roleAccountId.toString()

  // Create a member that will create the channels
  const [, memberKeyPair] = await api.createKeyPairs(2)
  const memberAddr = memberKeyPair.key.address
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [memberAddr])
  await new FixtureRunner(buyMembershipFixture).run()
  const [memberId] = buyMembershipFixture.getCreatedMembers()

  // Give member 100 JOY, to be able to create a few channels through CLI
  await api.treasuryTransferBalance(memberAddr, Utils.joy(100))

  // Use JoystreamCLI to create a few channels w/ some avatarPhoto and coverPhoto objects
  const joystreamCli = await createJoystreamCli()
  await joystreamCli.importAccount(memberKeyPair.key)

  const numChannels = 3

  const channelsData: { channelId: number; avatarPhotoPath: string; coverPhotoPath: string }[] = []
  for (let i = 0; i < numChannels; ++i) {
    const avatarPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(300, 300)
    const coverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1920, 500)
    const channelInput: ChannelCreationInputParameters = {
      title: `Cleanup test channel ${i + 1}`,
      avatarPhotoPath,
      coverPhotoPath,
      description: `This is a cleanup test channel ${i + 1}`,
      isPublic: true,
      language: 'en',
    }
    const channelId = await joystreamCli.createChannel(channelInput, [
      '--context',
      'Member',
      '--useMemberId',
      memberId.toString(),
    ])
    debug(`Created channel ${i + 1}`)
    channelsData.push({ channelId, avatarPhotoPath, coverPhotoPath })
  }
  const channelIds = channelsData.map((c) => c.channelId)

  // Wait until QN processes the channels
  debug('Waiting for QN to process the channels...')
  const channels = await query.tryQueryWithTimeout(
    () => query.channelsByIds(channelIds.map((id) => id.toString())),
    (r) => Utils.assert(r.length === numChannels, `Expected ${numChannels} channels, found: ${r.length}`)
  )

  // Give colossus nodes some time to sync
  debug('Giving colossus nodes 60 seconds to sync...')
  await Utils.wait(60_000)

  // Verify that both storage nodes store all the assets of created channels
  const colossus1Endpoint = doubleBucketConfig.buckets[0].metadata.endpoint
  const colossus2Endpoint = doubleBucketConfig.buckets[1].metadata.endpoint
  Utils.assert(colossus1Endpoint && colossus2Endpoint, 'Missing one of 2 colossus node endpoints!')

  const colossus1Api = new ColossusApi(urljoin(colossus1Endpoint, 'api/v1'))
  const colossus2Api = new ColossusApi(urljoin(colossus2Endpoint, 'api/v1'))

  const verifyAssets = async (colossus1StoredChannelIds: number[], colossus2StoredChannelIds: number[]) => {
    const verifyAssetsPromises = channelsData.map(async ({ channelId, avatarPhotoPath, coverPhotoPath }) => {
      const channel = channels.find((c) => c.id === channelId.toString())
      Utils.assert(channel, `Channel ${channelId} missing in QN result`)
      Utils.assert(channel.coverPhoto && channel.avatarPhoto, `Channel assets missing in QN result`)
      if (colossus1StoredChannelIds.includes(channelId)) {
        await Promise.all([
          colossus1Api.fetchAndVerifyAsset(channel.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp'),
          colossus1Api.fetchAndVerifyAsset(channel.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp'),
        ])
      } else {
        await Promise.all([
          colossus1Api.expectAssetNotFound(channel.coverPhoto.id),
          colossus1Api.expectAssetNotFound(channel.avatarPhoto.id),
        ])
      }
      if (colossus2StoredChannelIds.includes(channelId)) {
        await Promise.all([
          colossus2Api.fetchAndVerifyAsset(channel.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp'),
          colossus2Api.fetchAndVerifyAsset(channel.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp'),
        ])
      } else {
        await Promise.all([
          colossus2Api.expectAssetNotFound(channel.coverPhoto.id),
          colossus2Api.expectAssetNotFound(channel.avatarPhoto.id),
        ])
      }
    })
    await Promise.all(verifyAssetsPromises)
  }

  // At this point we expect both nodes to store all assets
  await verifyAssets(channelIds, channelIds)
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
      createType('BTreeSet<u64>', [1]) // Remove 1st bucket (colossu2)
    ),
    api.tx.storage.updateStorageBucketsForBag(
      bag2Id,
      createType('BTreeSet<u64>', []),
      createType('BTreeSet<u64>', [0]) // Remove 0th bucket (colossu1)
    ),
  ]
  await api.sendExtrinsicsAndGetResults(updateTxs, storageLeaderKey)

  // Wait 2 minutes to make sure cleanup is executed
  debug('Giving nodes 120 seconds to cleanup...')
  await Utils.wait(120_000)

  // Verify that Colossus2 (w/ auto cleanup) no longer stores 1st and 2nd channel assets,
  // while Colossus1 still stores all assets
  await verifyAssets(channelIds, channelIds.slice(2))
  debug('Cleanup correctly executed!')

  debug('Done')
}
