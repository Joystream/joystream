import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership/BuyMembershipHappyCaseFixture'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { Utils } from '../../utils'
import { statSync, readFileSync } from 'fs'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'
import { createType } from '@joystream/types'
import { u8aConcat, u8aFixLength } from '@polkadot/util'
import { ArgusApi } from '../../ArgusApi'
import {
  ChannelCreationInputParameters,
  ChannelUpdateInputParameters,
  VideoInputParameters,
} from '@joystream/cli/src/Types'

export default async function createAndUpdateChannel({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  const argusApi = new ArgusApi(env.DISTRIBUTOR_PUBLIC_API_URL || 'http://localhost:3334/api/v1')

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
  debug('Creating a channel...')
  const avatarPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(300, 300)
  const coverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1920, 500)
  const channelInput: ChannelCreationInputParameters = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
  }

  const memberContextFlags = ['--context', 'Member', '--useMemberId', memberId.toString()]
  const channelId = await joystreamCli.createChannel(channelInput, memberContextFlags)

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
  const channel = await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, channelInput.title)
      assert.equal(channel.description, channelInput.description)
      assert.equal(channel.isPublic, channelInput.isPublic)
      assert.equal(channel.language?.iso, channelInput.language)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.avatarPhoto?.isAccepted, true)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(coverPhotoPath).size)
      assert.equal(channel.coverPhoto?.isAccepted, true)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )
  // Just to avoid non-null assertions later
  Utils.assert(channel && channel.avatarPhoto && channel.coverPhoto)

  // Fetch assets from Argus and verify
  await argusApi.fetchAndVerifyAsset(channel.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp')
  await argusApi.fetchAndVerifyAsset(channel.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp')

  // Update channel
  debug('Updating channel...')
  const updatedCoverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1820, 400)
  const updateChannelInput: ChannelUpdateInputParameters = {
    title: 'Test channel [UPDATED!]',
    coverPhotoPath: updatedCoverPhotoPath,
    description: 'This is a test channel [UPDATED!]',
  }

  await joystreamCli.updateChannel(channelId, updateChannelInput)

  // Assert channel data after update
  const updatedChannel = await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, updateChannelInput.title)
      assert.equal(channel.description, updateChannelInput.description)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(updatedCoverPhotoPath).size)
      assert.equal(channel.coverPhoto?.isAccepted, true)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )

  // Just to avoid non-null assertions later
  Utils.assert(updatedChannel && updatedChannel.coverPhoto)

  // Fetch updated asset from Argus and verify
  await argusApi.fetchAndVerifyAsset(updatedChannel.coverPhoto.id, readFileSync(updatedCoverPhotoPath), 'image/bmp')

  // Create video
  debug('Creating a video...')
  const videoPixelWidth = 1920
  const videoPixelHeight = 1080
  const videoPath = joystreamCli.getTmpFileManager().randomImgFile(videoPixelWidth, videoPixelHeight)
  const thumbnailPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(640, 360)
  const subtitleAssetPath = joystreamCli.getTmpFileManager().jsonFile([[0, 'Some example subtitle']])
  const subtitlesMeta = { type: 'subtitle', language: 'en', mimeType: 'text/plain', subtitleAssetPath }
  const videoInput: VideoInputParameters = {
    videoPath,
    thumbnailPhotoPath,
    subtitles: [subtitlesMeta],
    title: 'Test video',
    description: 'This is a test video',
    isPublic: true,
    isExplicit: false,
    hasMarketing: false,
    language: 'en',
    license: {
      code: 1003,
      attribution: 'Joystream contributors',
    },
    enableComments: true,
  }
  const expectedDetectedMediaType = {
    codecName: 'bmp',
    container: 'bmp',
    mimeMediaType: 'image/bmp',
  }
  const { videoId } = await joystreamCli.createVideo(channelId, videoInput, false)

  // Assert video data after creation
  const video = await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, videoInput.title)
      assert.equal(video.description, videoInput.description)
      assert.equal(video.isPublic, videoInput.isPublic)
      assert.equal(video.isExplicit, videoInput.isExplicit)
      assert.equal(video.hasMarketing, videoInput.hasMarketing)
      assert.equal(video.language?.iso, videoInput.language)
      assert.equal(video.mediaMetadata?.encoding?.codecName, expectedDetectedMediaType.codecName)
      assert.equal(video.mediaMetadata?.encoding?.container, expectedDetectedMediaType.container)
      assert.equal(video.mediaMetadata?.encoding?.mimeMediaType, expectedDetectedMediaType.mimeMediaType)
      assert.equal(video.mediaMetadata?.pixelHeight, videoPixelHeight)
      assert.equal(video.mediaMetadata?.pixelWidth, videoPixelWidth)
      assert.equal(video.mediaMetadata?.size, statSync(videoPath).size)
      assert.equal(video.media?.type.__typename, 'DataObjectTypeVideoMedia')
      assert.equal(video.media?.size, statSync(videoPath).size)
      assert.equal(video.media?.isAccepted, true)
      assert.equal(video.thumbnailPhoto?.type.__typename, 'DataObjectTypeVideoThumbnail')
      assert.equal(video.thumbnailPhoto?.size, statSync(thumbnailPhotoPath).size)
      assert.equal(video.thumbnailPhoto?.isAccepted, true)
      assert.equal(video.license?.code, videoInput.license?.code)
      assert.equal(video.license?.attribution, videoInput.license?.attribution)
      assert.equal(video.subtitles[0].language?.iso, subtitlesMeta.language)
      assert.equal(video.subtitles[0].mimeType, subtitlesMeta.mimeType)
      assert.equal(video.subtitles[0].type, subtitlesMeta.type)
      assert.equal(video.subtitles[0].asset?.size, statSync(subtitleAssetPath).size)
      assert.equal(video.subtitles[0].asset?.type.__typename, 'DataObjectTypeVideoSubtitle')
      assert.equal(video.subtitles[0].asset?.isAccepted, true)
      assert.equal(video.isCommentSectionEnabled, videoInput.enableComments)
    }
  )

  // Just to avoid non-null assertions later
  Utils.assert(video && video.subtitles[0].asset && video.media && video.thumbnailPhoto)

  // Fetch assets from Argus and verify
  await argusApi.fetchAndVerifyAsset(video.subtitles[0].asset.id, readFileSync(subtitleAssetPath), 'text/plain')
  await argusApi.fetchAndVerifyAsset(video.media.id, readFileSync(videoPath), 'image/bmp')
  await argusApi.fetchAndVerifyAsset(video.thumbnailPhoto.id, readFileSync(thumbnailPhotoPath), 'image/bmp')

  // Video update
  debug('Updating video...')
  const updatedVideoPixelWidth = 1280
  const updatedVideoPixelHeight = 720
  const updatedVideoPath = joystreamCli
    .getTmpFileManager()
    .randomImgFile(updatedVideoPixelWidth, updatedVideoPixelHeight)
  const updatedThumbnailPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(800, 450)
  const videoUpdateInput: VideoInputParameters = {
    videoPath: updatedVideoPath,
    thumbnailPhotoPath: updatedThumbnailPhotoPath,
    clearSubtitles: true,
    title: 'Test video [UPDATED!]',
    description: 'This is a test video [UPDATED!]',
    isPublic: false,
    isExplicit: true,
    hasMarketing: true,
    language: 'fr',
    license: {
      code: 1000,
      attribution: '',
    },
    enableComments: false,
  }

  await joystreamCli.updateVideo(channelId, videoUpdateInput)

  // Assert video data after update
  const updatedVideo = await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, videoUpdateInput.title)
      assert.equal(video.description, videoUpdateInput.description)
      assert.equal(video.isPublic, videoUpdateInput.isPublic)
      assert.equal(video.isExplicit, videoUpdateInput.isExplicit)
      assert.equal(video.hasMarketing, videoUpdateInput.hasMarketing)
      assert.equal(video.language?.iso, videoUpdateInput.language)
      assert.equal(video.mediaMetadata?.pixelHeight, updatedVideoPixelHeight)
      assert.equal(video.mediaMetadata?.pixelWidth, updatedVideoPixelWidth)
      assert.equal(video.mediaMetadata?.size, statSync(updatedVideoPath).size)

      // Encoding remains unchanged
      assert.equal(video.mediaMetadata?.encoding?.codecName, expectedDetectedMediaType.codecName)
      assert.equal(video.mediaMetadata?.encoding?.container, expectedDetectedMediaType.container)
      assert.equal(video.mediaMetadata?.encoding?.mimeMediaType, expectedDetectedMediaType.mimeMediaType)

      assert.equal(video.media?.type.__typename, 'DataObjectTypeVideoMedia')
      assert.equal(video.media?.size, statSync(updatedVideoPath).size)
      assert.equal(video.media?.isAccepted, true)
      assert.equal(video.thumbnailPhoto?.type.__typename, 'DataObjectTypeVideoThumbnail')
      assert.equal(video.thumbnailPhoto?.size, statSync(updatedThumbnailPhotoPath).size)
      assert.equal(video.thumbnailPhoto?.isAccepted, true)
      assert.equal(video.license?.code, videoUpdateInput.license?.code)
      assert.equal(video.license?.attribution, '')
      assert.isEmpty(video.subtitles)
      assert.equal(video.isCommentSectionEnabled, videoUpdateInput.enableComments)
    }
  )

  // Just to avoid non-null assertions later
  Utils.assert(updatedVideo && updatedVideo.media && updatedVideo.thumbnailPhoto)

  // Fetch assets from Argus and verify
  await argusApi.fetchAndVerifyAsset(updatedVideo.media.id, readFileSync(updatedVideoPath), 'image/bmp')
  await argusApi.fetchAndVerifyAsset(
    updatedVideo.thumbnailPhoto.id,
    readFileSync(updatedThumbnailPhotoPath),
    'image/bmp'
  )

  debug('Done')
}
