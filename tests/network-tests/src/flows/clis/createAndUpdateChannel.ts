import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership/BuyMembershipHappyCaseFixture'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { Utils } from '../../utils'
import { statSync } from 'fs'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'
import { createType } from '@joystream/types'
import { u8aConcat, u8aFixLength } from '@polkadot/util'

export default async function createAndUpdateChannel({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  // Create channel owner membership
  const [channelOwnerKeypair] = await api.createKeyPairs(1)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [channelOwnerKeypair.key.address])
  await new FixtureRunner(buyMembershipFixture).run()
  const memberId = buyMembershipFixture.getCreatedMembers()[0]

  // Send some funds to pay the state_bloat_bond and fees
  const channelOwnerBalance = new BN(100_000_000_000)
  await api.treasuryTransferBalance(channelOwnerKeypair.key.address, channelOwnerBalance)

  // Create and init Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // Import & select channel owner key
  await joystreamCli.init()
  await joystreamCli.importAccount(channelOwnerKeypair.key)

  // Create channel
  const avatarPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(300, 300)
  const coverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1920, 500)
  const channelInput = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
  }

  const channelId = await joystreamCli.createChannel(channelInput, [
    '--context',
    'Member',
    '--useMemberId',
    memberId.toString(),
  ])

  const expectedChannelRewardAccount = api
    .createType(
      'AccountId32',
      u8aFixLength(
        u8aConcat(
          'modl',
          'mContent',
          createType('Bytes', 'CHANNEL').toU8a(false),
          createType('u64', channelId).toU8a()
        ),
        32 * 8,
        true
      )
    )
    .toString()

  // Assert channel data after creation
  await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, channelInput.title)
      assert.equal(channel.description, channelInput.description)
      assert.equal(channel.isPublic, channelInput.isPublic)
      assert.equal(channel.language?.iso, channelInput.language)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(coverPhotoPath).size)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )

  const updatedCoverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1820, 400)
  const updateChannelInput = {
    title: 'Test channel [UPDATED!]',
    coverPhotoPath: updatedCoverPhotoPath,
    description: 'This is a test channel [UPDATED!]',
  }

  await joystreamCli.updateChannel(channelId, updateChannelInput)

  // Assert channel data after update
  await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, updateChannelInput.title)
      assert.equal(channel.description, updateChannelInput.description)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(updatedCoverPhotoPath).size)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )
  debug('Done')
}
