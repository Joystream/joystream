import { VideoMetadata, PublishedBeforeJoystream, MediaType, License } from '../src'
import { assert, expect } from 'chai'

describe('Video Metadata', () => {
  it('Message', () => {
    const meta = new VideoMetadata()

    const title = 'Video Title'
    const description = 'Video Description'
    const duration = 100

    meta.setTitle(title)
    meta.setDescription(description)
    meta.setDuration(duration)
    meta.setMediaPixelHeight(1)
    meta.setMediaPixelWidth(2)
    meta.setMediaType(new MediaType())
    meta.setLanguage('en')
    meta.setLicense(new License())
    meta.setPublishedBeforeJoystream(new PublishedBeforeJoystream())
    meta.setHasMarketing(true)
    meta.setIsPublic(true)
    meta.setIsExplicit(false)
    meta.setVideo(0)
    meta.setThumbnailPhoto(1)
    meta.setCategory(101)

    assert.deepEqual(meta.toObject(), {
      title,
      description,
      duration,
      mediaPixelHeight: 1,
      mediaPixelWidth: 2,
      mediaType: {
        codecName: undefined,
        container: undefined,
        mimeMediaType: undefined,
      },
      language: 'en',
      license: {
        code: undefined,
        attribution: undefined,
        customText: undefined,
      },
      publishedBeforeJoystream: { isPublished: undefined, date: undefined },
      hasMarketing: true,
      isPublic: true,
      isExplicit: false,
      thumbnailPhoto: 1,
      video: 0,
      personsList: [],
      category: 101,
    })

    // sanity check - encoding / decoding works
    assert.deepEqual(VideoMetadata.deserializeBinary(meta.serializeBinary()), meta)
  })

  it('Message: PublishedBeforeJoystream', () => {
    const meta = new VideoMetadata()

    expect(meta.hasPublishedBeforeJoystream()).equals(false, 'PublishedBeforeJoystream field should NOT be set')

    const published = new PublishedBeforeJoystream()
    const isPublished = true
    const date = '1950-12-24'
    published.setIsPublished(isPublished)
    published.setDate(date)

    meta.setPublishedBeforeJoystream(published)

    // Field should now be set
    expect(meta.hasPublishedBeforeJoystream()).equals(true, 'PublishedBeforeJoystream field should be set')

    assert.deepEqual(published.toObject(), {
      isPublished,
      date,
    })
  })

  it('Message: License', () => {
    const license = new License()

    const code = 1000
    const attribution = 'Attribution Text'
    const customText = 'Custom License Details'
    license.setCode(code)
    license.setAttribution(attribution)
    license.setCustomText(customText)

    assert.deepEqual(license.toObject(), {
      code,
      attribution,
      customText,
    })
  })

  it('Message: MediaType', () => {
    const mediaType = new MediaType()

    const codecName = 'mpeg4'
    const container = 'avi'
    const mimeMediaType = 'videp/mp4'

    mediaType.setCodecName(codecName)
    mediaType.setContainer(container)
    mediaType.setMimeMediaType(mimeMediaType)

    assert.deepEqual(mediaType.toObject(), {
      codecName,
      container,
      mimeMediaType,
    })
  })
})
