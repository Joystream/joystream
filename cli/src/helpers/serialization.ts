import {
  VideoMetadata,
  PublishedBeforeJoystream,
  License,
  MediaType,
  ChannelMetadata,
  ChannelCategoryMetadata,
  VideoCategoryMetadata,
} from '@joystream/content-metadata-protobuf'
import {
  VideoUpdateParametersInput,
  VideoCreationParametersInput,
  ChannelUpdateParametersInput,
  ChannelCreationParametersInput,
  ChannelCategoryCreationParametersInput,
  ChannelCategoryUpdateParametersInput,
  VideoCategoryCreationParametersInput,
  VideoCategoryUpdateParametersInput,
} from '../Types'
import { ApiPromise } from '@polkadot/api'
import { Bytes } from '@polkadot/types/primitive'

export function binaryToMeta(api: ApiPromise, serialized: Uint8Array): Bytes {
  return api.createType('Bytes', '0x' + Buffer.from(serialized).toString('hex'))
}

export function videoMetadataFromInput(
  api: ApiPromise,
  videoParametersInput: VideoCreationParametersInput | VideoUpdateParametersInput
): Bytes {
  const mediaType = new MediaType()
  mediaType.setCodecName(videoParametersInput.meta.mediaType!.codecName!)
  mediaType.setContainer(videoParametersInput.meta.mediaType!.container!)
  mediaType.setMimeMediaType(videoParametersInput.meta.mediaType!.mimeMediaType!)

  const license = new License()
  license.setCode(videoParametersInput.meta.license!.code!)
  license.setAttribution(videoParametersInput.meta.license!.attribution!)
  license.setCustomText(videoParametersInput.meta.license!.customText!)

  const publishedBeforeJoystream = new PublishedBeforeJoystream()
  publishedBeforeJoystream.setIsPublished(videoParametersInput.meta.publishedBeforeJoystream!.isPublished!)
  publishedBeforeJoystream.setDate(videoParametersInput.meta.publishedBeforeJoystream!.date!)

  const videoMetadata = new VideoMetadata()
  videoMetadata.setTitle(videoParametersInput.meta.title!)
  videoMetadata.setDescription(videoParametersInput.meta.description!)
  videoMetadata.setVideo(videoParametersInput.meta.video!)
  videoMetadata.setThumbnailPhoto(videoParametersInput.meta.thumbnailPhoto!)
  videoMetadata.setDuration(videoParametersInput.meta.duration!)
  videoMetadata.setMediaPixelHeight(videoParametersInput.meta.mediaPixelHeight!)
  videoMetadata.setMediaPixelWidth(videoParametersInput.meta.mediaPixelWidth!)
  videoMetadata.setLanguage(videoParametersInput.meta.language!)
  videoMetadata.setHasMarketing(videoParametersInput.meta.hasMarketing!)
  videoMetadata.setIsPublic(videoParametersInput.meta.isPublic!)
  videoMetadata.setIsExplicit(videoParametersInput.meta.isExplicit!)
  videoMetadata.setPersonsList(videoParametersInput.meta.personsList!)
  videoMetadata.setCategory(videoParametersInput.meta.category!)

  videoMetadata.setMediaType(mediaType)
  videoMetadata.setLicense(license)
  videoMetadata.setPublishedBeforeJoystream(publishedBeforeJoystream)

  const serialized = videoMetadata.serializeBinary()
  return binaryToMeta(api, serialized)
}

export function channelMetadataFromInput(
  api: ApiPromise,
  channelParametersInput: ChannelCreationParametersInput | ChannelUpdateParametersInput
): Bytes {
  const channelMetadata = new ChannelMetadata()
  channelMetadata.setTitle(channelParametersInput.meta.title!)
  channelMetadata.setDescription(channelParametersInput.meta.description!)
  channelMetadata.setIsPublic(channelParametersInput.meta.isPublic!)
  channelMetadata.setLanguage(channelParametersInput.meta.language!)
  channelMetadata.setCoverPhoto(channelParametersInput.meta.coverPhoto!)
  channelMetadata.setAvatarPhoto(channelParametersInput.meta.avatarPhoto!)
  channelMetadata.setCategory(channelParametersInput.meta.category!)

  const serialized = channelMetadata.serializeBinary()
  return binaryToMeta(api, serialized)
}

export function channelCategoryMetadataFromInput(
  api: ApiPromise,
  channelCategoryParametersInput: ChannelCategoryCreationParametersInput | ChannelCategoryUpdateParametersInput
): Bytes {
  const channelCategoryMetadata = new ChannelCategoryMetadata()
  channelCategoryMetadata.setName(channelCategoryParametersInput.meta.name!)

  const serialized = channelCategoryMetadata.serializeBinary()
  return binaryToMeta(api, serialized)
}

export function videoCategoryMetadataFromInput(
  api: ApiPromise,
  videoCategoryParametersInput: VideoCategoryCreationParametersInput | VideoCategoryUpdateParametersInput
): Bytes {
  const videoCategoryMetadata = new VideoCategoryMetadata()
  videoCategoryMetadata.setName(videoCategoryParametersInput.meta.name!)

  const serialized = videoCategoryMetadata.serializeBinary()
  return binaryToMeta(api, serialized)
}
