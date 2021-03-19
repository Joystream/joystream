import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { NewAsset} from '@joystream/types/content'
import {VideoMetadata, PublishedBeforeJoystream, License, MediaType} from '@joystream/content-metadata-protobuf'
import { Vec, Option} from '@polkadot/types';
import { Bytes } from '@polkadot/types/primitive';

type VideoUpdateParametersInput = {
  assets: Option<Vec<NewAsset>>,
  meta: VideoMetadata.AsObject,
}

type VideoUpdateParameters = {
  assets: Option<Vec<NewAsset>>,
  meta: Bytes,
}

export default class UpdateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  static args = [
    {
      name: 'videoId',
      required: true,
      description: 'ID of the Video',
    },
  ]

  async run() {
    let { context, input, output } = this.parse(UpdateVideoCommand).flags

    const { videoId } = this.parse(UpdateVideoCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let videoUpdateParametersInput = await getInputJson<VideoUpdateParametersInput>(input)

      let mediaType = new MediaType()
      mediaType.setCodecName(videoUpdateParametersInput.meta.mediaType?.codecName!)
      mediaType.setContainer(videoUpdateParametersInput.meta.mediaType?.container!)
      mediaType.setMimeMediaType(videoUpdateParametersInput.meta.mediaType?.mimeMediaType!)

      let license = new License()
      license.setCode(videoUpdateParametersInput.meta.license?.code!)
      license.setAttribution(videoUpdateParametersInput.meta.license?.attribution!)
      license.setCustomText(videoUpdateParametersInput.meta.license?.customText!)

      let publishedBeforeJoystream = new PublishedBeforeJoystream()
      publishedBeforeJoystream.setIsPublished(videoUpdateParametersInput.meta.publishedBeforeJoystream?.isPublished!)
      publishedBeforeJoystream.setDate(videoUpdateParametersInput.meta.publishedBeforeJoystream?.date!)

      let videoMetadata = new VideoMetadata()
      videoMetadata.setTitle(videoUpdateParametersInput.meta.title!)
      videoMetadata.setDescription(videoUpdateParametersInput.meta.description!)
      videoMetadata.setVideo(videoUpdateParametersInput.meta.video!)
      videoMetadata.setThumbnailPhoto(videoUpdateParametersInput.meta.thumbnailPhoto!)
      videoMetadata.setDuration(videoUpdateParametersInput.meta.duration!)
      videoMetadata.setMediaPixelHeight(videoUpdateParametersInput.meta.mediaPixelHeight!)
      videoMetadata.setMediaPixelWidth(videoUpdateParametersInput.meta.mediaPixelWidth!)
      videoMetadata.setLanguage(videoUpdateParametersInput.meta.language!)
      videoMetadata.setHasMarketing(videoUpdateParametersInput.meta.hasMarketing!)
      videoMetadata.setIsPublic(videoUpdateParametersInput.meta.isPublic!)
      videoMetadata.setIsExplicit(videoUpdateParametersInput.meta.isExplicit!)
      videoMetadata.setPersonsList(videoUpdateParametersInput.meta.personsList!)
      videoMetadata.setCategory(videoUpdateParametersInput.meta.category!)

      videoMetadata.setMediaType(mediaType)
      videoMetadata.setLicense(license)
      videoMetadata.setPublishedBeforeJoystream(publishedBeforeJoystream)


      const serialized = videoMetadata.serializeBinary();

      const api = await this.getOriginalApi()
      
      const metaRaw = api.createType('Raw', serialized)
      const meta = new Bytes(api.registry, metaRaw)

      let videoUpdateParameters: VideoUpdateParameters = {
        assets: videoUpdateParametersInput.assets,
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoUpdateParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && videoUpdateParametersInput)  {
        saveOutputJson(output, `${videoUpdateParametersInput.meta.title}Video.json`, videoUpdateParametersInput)
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideo', [actor, videoId, videoUpdateParameters])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
