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
  ChannelCategoryInputParameters,
  ChannelInputParameters,
  VideoCategoryInputParameters,
  VideoInputParameters,
} from '../Types'
import { Bytes } from '@polkadot/types/primitive'
import { createType } from '@joystream/types'

type AnyMetadata = {
  serializeBinary(): Uint8Array
}

export function metadataToBytes(metadata: AnyMetadata): Bytes {
  const bytes = createType('Bytes', '0x' + Buffer.from(metadata.serializeBinary()).toString('hex'))
  console.log('Metadata as Bytes:', bytes.toString())
  return bytes
}

// TODO: If "fromObject()" was generated for the protobuffs we could avoid having to create separate converters for each metadata

export function videoMetadataFromInput(videoParametersInput: VideoInputParameters): VideoMetadata {
  const videoMetadata = new VideoMetadata()
  videoMetadata.setTitle(videoParametersInput.title as string)
  videoMetadata.setDescription(videoParametersInput.description as string)
  videoMetadata.setDuration(videoParametersInput.duration as number)
  videoMetadata.setMediaPixelHeight(videoParametersInput.mediaPixelHeight as number)
  videoMetadata.setMediaPixelWidth(videoParametersInput.mediaPixelWidth as number)
  videoMetadata.setLanguage(videoParametersInput.language as string)
  videoMetadata.setHasMarketing(videoParametersInput.hasMarketing as boolean)
  videoMetadata.setIsPublic(videoParametersInput.isPublic as boolean)
  videoMetadata.setIsExplicit(videoParametersInput.isExplicit as boolean)
  videoMetadata.setPersonsList(videoParametersInput.personsList as number[])
  videoMetadata.setCategory(videoParametersInput.category as number)

  if (videoParametersInput.mediaType) {
    const mediaType = new MediaType()
    mediaType.setCodecName(videoParametersInput.mediaType.codecName as string)
    mediaType.setContainer(videoParametersInput.mediaType.container as string)
    mediaType.setMimeMediaType(videoParametersInput.mediaType.mimeMediaType as string)
    videoMetadata.setMediaType(mediaType)
  }

  if (videoParametersInput.publishedBeforeJoystream) {
    const publishedBeforeJoystream = new PublishedBeforeJoystream()
    publishedBeforeJoystream.setIsPublished(videoParametersInput.publishedBeforeJoystream.isPublished as boolean)
    publishedBeforeJoystream.setDate(videoParametersInput.publishedBeforeJoystream.date as string)
    videoMetadata.setPublishedBeforeJoystream(publishedBeforeJoystream)
  }

  if (videoParametersInput.license) {
    const license = new License()
    license.setCode(videoParametersInput.license.code as number)
    license.setAttribution(videoParametersInput.license.attribution as string)
    license.setCustomText(videoParametersInput.license.customText as string)
    videoMetadata.setLicense(license)
  }

  return videoMetadata
}

export function channelMetadataFromInput(channelParametersInput: ChannelInputParameters): ChannelMetadata {
  const channelMetadata = new ChannelMetadata()
  channelMetadata.setTitle(channelParametersInput.title as string)
  channelMetadata.setDescription(channelParametersInput.description as string)
  channelMetadata.setIsPublic(channelParametersInput.isPublic as boolean)
  channelMetadata.setLanguage(channelParametersInput.language as string)
  channelMetadata.setCategory(channelParametersInput.category as number)

  return channelMetadata
}

export function channelCategoryMetadataFromInput(
  channelCategoryParametersInput: ChannelCategoryInputParameters
): ChannelCategoryMetadata {
  const channelCategoryMetadata = new ChannelCategoryMetadata()
  channelCategoryMetadata.setName(channelCategoryParametersInput.name as string)

  return channelCategoryMetadata
}

export function videoCategoryMetadataFromInput(
  videoCategoryParametersInput: VideoCategoryInputParameters
): VideoCategoryMetadata {
  const videoCategoryMetadata = new VideoCategoryMetadata()
  videoCategoryMetadata.setName(videoCategoryParametersInput.name as string)

  return videoCategoryMetadata
}
