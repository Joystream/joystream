import {
  VideoMetadata,
  PublishedBeforeJoystream,
  License,
  MediaType,
  ChannelMetadata,
} from '@joystream/content-metadata-protobuf'
import {
  VideoUpdateParametersInput,
  VideoCreationParametersInput,
  ChannelUpdateParametersInput,
  ChannelCreationParametersInput,
} from '../Types'
import { ApiPromise } from '@polkadot/api'
import { Bytes } from '@polkadot/types/primitive'

export function BinaryToMeta(api: ApiPromise, serialized: Uint8Array): Bytes {
  const metaRaw = api.createType('Raw', serialized)
  return new Bytes(api.registry, metaRaw)
}

export function videoMetadataFromInput(
  api: ApiPromise,
  videoParametersInput: VideoCreationParametersInput | VideoUpdateParametersInput
): Bytes {
  let mediaType = new MediaType()
  mediaType.setCodecName(videoParametersInput.meta.mediaType?.codecName!)
  mediaType.setContainer(videoParametersInput.meta.mediaType?.container!)
  mediaType.setMimeMediaType(videoParametersInput.meta.mediaType?.mimeMediaType!)

  let license = new License()
  license.setCode(videoParametersInput.meta.license?.code!)
  license.setAttribution(videoParametersInput.meta.license?.attribution!)
  license.setCustomText(videoParametersInput.meta.license?.customText!)

  let publishedBeforeJoystream = new PublishedBeforeJoystream()
  publishedBeforeJoystream.setIsPublished(videoParametersInput.meta.publishedBeforeJoystream?.isPublished!)
  publishedBeforeJoystream.setDate(videoParametersInput.meta.publishedBeforeJoystream?.date!)

  let videoMetadata = new VideoMetadata()
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
  return BinaryToMeta(api, serialized)
}

export function channelMetadataFromInput(
  api: ApiPromise,
  channelParametersInput: ChannelCreationParametersInput | ChannelUpdateParametersInput
): Bytes {
  let channelMetadata = new ChannelMetadata()
  channelMetadata.setTitle(channelParametersInput.meta.title!)
  channelMetadata.setDescription(channelParametersInput.meta.description!)
  channelMetadata.setIsPublic(channelParametersInput.meta.isPublic!)
  channelMetadata.setLanguage(channelParametersInput.meta.language!)
  channelMetadata.setCoverPhoto(channelParametersInput.meta.coverPhoto!)
  channelMetadata.setAvatarPhoto(channelParametersInput.meta.avatarPhoto!)
  channelMetadata.setCategory(channelParametersInput.meta.category!)

  const serialized = channelMetadata.serializeBinary()
  return BinaryToMeta(api, serialized)
}
