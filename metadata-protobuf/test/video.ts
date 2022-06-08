import { VideoMetadata, MediaType } from '../src'
import { assert, expect } from 'chai'
import { isSet, encodeDecode, metaToObject } from '../src/utils'
import Long from 'long'

describe('Video Metadata', () => {
  it('Message', () => {
    const video = {
      title: 'Video Title',
      description: 'Video Description',
      duration: 100,
      mediaPixelHeight: 1,
      mediaPixelWidth: 2,
      mediaType: {},
      language: 'en',
      license: {},
      publishedBeforeJoystream: {},
      hasMarketing: true,
      isPublic: true,
      isExplicit: false,
      video: 0,
      thumbnailPhoto: 1,
      category: Long.fromNumber(101, true),
    }
    const videoMessage = new VideoMetadata(video)

    assert.deepEqual(metaToObject(VideoMetadata, videoMessage), { ...video, category: '101' })
    assert.deepEqual(encodeDecode(VideoMetadata, video), { ...video, category: '101' })
  })

  it('Message: PublishedBeforeJoystream', () => {
    const meta = new VideoMetadata()

    expect(isSet(metaToObject(VideoMetadata, meta).publishedBeforeJoystream)).equals(
      false,
      'PublishedBeforeJoystream field should NOT be set'
    )

    const published = {
      isPublished: true,
      date: '1950-12-24',
    }
    meta.publishedBeforeJoystream = published

    // Field should now be set
    expect(isSet(metaToObject(VideoMetadata, meta).publishedBeforeJoystream)).equals(
      true,
      'PublishedBeforeJoystream field should be set'
    )

    assert.deepEqual(metaToObject(VideoMetadata, meta).publishedBeforeJoystream, published)
    assert.deepEqual(encodeDecode(VideoMetadata, meta).publishedBeforeJoystream, meta.publishedBeforeJoystream)
  })

  it('Message: License', () => {
    const license = {
      code: 1000,
      attribution: 'Attribution Text',
      customText: 'Custom License Details',
    }
    const meta = new VideoMetadata({ license })
    assert.deepEqual(metaToObject(VideoMetadata, meta).license, license)
    assert.deepEqual(encodeDecode(VideoMetadata, meta).license, license)

    // Empty object check
    meta.license = {}
    assert.deepEqual(metaToObject(VideoMetadata, meta).license, {})
    assert.deepEqual(encodeDecode(VideoMetadata, meta).license, {})

    // Unset check
    meta.license = undefined
    assert.deepEqual(metaToObject(VideoMetadata, meta).license, undefined)
    assert.deepEqual(encodeDecode(VideoMetadata, meta).license, undefined)
  })

  it('Message: MediaType', () => {
    const mediaType = {
      codecName: 'mpeg4',
      container: 'avi',
      mimeMediaType: 'videp/mp4',
    }
    const mediaTypeMessage = new MediaType(mediaType)

    assert.deepEqual(metaToObject(MediaType, mediaTypeMessage), mediaType)
    assert.deepEqual(encodeDecode(MediaType, mediaType), mediaType)
  })
})
