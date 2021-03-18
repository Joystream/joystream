import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { NewAsset} from '@joystream/types/content'
import {VideoMetadata, PublishedBeforeJoystream, License, MediaType} from '@joystream/content-metadata-protobuf'
import { Vec} from '@polkadot/types';
import { Bytes } from '@polkadot/types/primitive';

type VideoCreationParametersInput = {
  assets: Vec<NewAsset>,
  meta: VideoMetadata.AsObject,
}

type VideoCreationParameters = {
  assets: Vec<NewAsset>,
  meta: Bytes,
}

export default class CreateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Create video under specific channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run() {
    let { context, input, output } = this.parse(CreateVideoCommand).flags

    const { channelId } = this.parse(CreateVideoCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let videoCreationParametersInput = await getInputJson<VideoCreationParametersInput>(input)

      let mediaType = new MediaType()
      mediaType.setCodecName(videoCreationParametersInput.meta.mediaType?.codecName!)
      mediaType.setContainer(videoCreationParametersInput.meta.mediaType?.container!)
      mediaType.setMimeMediaType(videoCreationParametersInput.meta.mediaType?.mimeMediaType!)

      let license = new License()
      license.setCode(videoCreationParametersInput.meta.license?.code!)
      license.setAttribution(videoCreationParametersInput.meta.license?.attribution!)
      license.setCustomText(videoCreationParametersInput.meta.license?.customText!)

      let publishedBeforeJoystream = new PublishedBeforeJoystream()
      publishedBeforeJoystream.setIsPublished(videoCreationParametersInput.meta.publishedBeforeJoystream?.isPublished!)
      publishedBeforeJoystream.setDate(videoCreationParametersInput.meta.publishedBeforeJoystream?.date!)

      let videoMetadata = new VideoMetadata()
      videoMetadata.setTitle(videoCreationParametersInput.meta.title!)
      videoMetadata.setDescription(videoCreationParametersInput.meta.description!)
      videoMetadata.setVideo(videoCreationParametersInput.meta.video!)
      videoMetadata.setThumbnailPhoto(videoCreationParametersInput.meta.thumbnailPhoto!)
      videoMetadata.setDuration(videoCreationParametersInput.meta.thumbnailPhoto!)
      videoMetadata.setMediaPixelHeight(videoCreationParametersInput.meta.mediaPixelHeight!)
      videoMetadata.setMediaPixelWidth(videoCreationParametersInput.meta.mediaPixelWidth!)
      videoMetadata.setLanguage(videoCreationParametersInput.meta.language!)
      videoMetadata.setHasMarketing(videoCreationParametersInput.meta.hasMarketing!)
      videoMetadata.setIsPublic(videoCreationParametersInput.meta.isPublic!)
      videoMetadata.setIsExplicit(videoCreationParametersInput.meta.isPublic!)
      videoMetadata.setPersonsList(videoCreationParametersInput.meta.personsList!)
      videoMetadata.setCategory(videoCreationParametersInput.meta.category!)

      videoMetadata.setMediaType(mediaType)
      videoMetadata.setLicense(license)
      videoMetadata.setPublishedBeforeJoystream(publishedBeforeJoystream)


      const serialized = videoMetadata.serializeBinary();

      const api = await this.getOriginalApi()
      
      const metaRaw = api.createType('Raw', serialized)
      const meta = new Bytes(api.registry, metaRaw)

      let videoCreationParameters: VideoCreationParameters = {
        assets: videoCreationParametersInput.assets,
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoCreationParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && videoCreationParametersInput)  {
        saveOutputJson(output, `${videoCreationParametersInput.meta.title}Video.json`, videoCreationParametersInput)
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createVideo', [actor, channelId, videoCreationParameters])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
