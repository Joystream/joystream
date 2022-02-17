import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { JoystreamCLI } from '../../cli/joystream'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership/BuyMembershipHappyCaseFixture'
import { FixtureRunner } from '../../Fixture'
import { TmpFileManager } from '../../cli/utils'
import { assert } from 'chai'
import { Utils } from '../../utils'
import { statSync } from 'fs'
import BN from 'bn.js'

export default async function createChannel({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  // Create channel owner membership
  const [channelOwnerKeypair] = await api.createKeyPairs(1)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [channelOwnerKeypair.key.address])
  await new FixtureRunner(buyMembershipFixture).run()

  // Send some funds to pay the deletion_prize and fees
  const channelOwnerBalance = new BN(10000)
  await api.treasuryTransferBalance(channelOwnerKeypair.key.address, channelOwnerBalance)

  // Create Joystream CLI
  const tmpFileManager = new TmpFileManager()
  const joystreamCli = new JoystreamCLI(tmpFileManager)

  // Init CLI, import & select channel owner key
  await joystreamCli.init()
  await joystreamCli.importKey(channelOwnerKeypair.key)

  // Create channel
  const avatarPhotoPath = tmpFileManager.randomImgFile(300, 300)
  const coverPhotoPath = tmpFileManager.randomImgFile(1920, 500)
  const channelInput = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
    rewardAccount: channelOwnerKeypair.key.address,
  }
  const { out: channelId } = await joystreamCli.createChannel(channelInput, ['--context', 'Member'])

  await query.tryQueryWithTimeout(
    () => query.channelById(channelId),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, channelInput.title)
      assert.equal(channel.description, channelInput.description)
      assert.equal(channel.isPublic, channelInput.isPublic)
      assert.equal(channel.language?.iso, channelInput.language)
      assert.equal(channel.rewardAccount, channelInput.rewardAccount)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(coverPhotoPath).size)
    }
  )

  debug('Done')
}
