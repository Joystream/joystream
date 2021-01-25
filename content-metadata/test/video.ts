import { VideoMetadata, PublishedBeforeJoystream } from '../proto/Video_pb'
import { assert, expect } from 'chai'

describe('Video Metadata', () => {
  it('Create Video Metadata', () => {
    const meta = new VideoMetadata()

    const title = 'Video Title'
    const description = 'Video Description'
    const duration = 100

    meta.setTitle(title)
    meta.setDescription(description)
    meta.setDuration(duration)

    // Test optional field
    expect(meta.hasPublishedBeforeJoystream()).equals(false, 'PublishedBeforeJoystream field should NOT be set')

    // Set published before joystream field
    const published = new PublishedBeforeJoystream()
    const isPublished = true
    const timestamp = 10000
    published.setIsPublished(isPublished)
    published.setTimestamp(timestamp)
    meta.setPublishedBeforeJoystream(published)
    // Field show now be set
    expect(meta.hasPublishedBeforeJoystream()).equals(true, 'PublishedBeforeJoystream field should be set')

    assert.deepEqual(VideoMetadata.deserializeBinary(meta.serializeBinary()), meta)

    assert.deepEqual(meta.toObject(), {
      title,
      description,
      duration,
      mediaPixelHeight: undefined,
      mediaPixelWidth: undefined,
      mediaType: undefined,
      language: undefined,
      license: undefined,
      publishedBeforeJoystream: { isPublished, timestamp },
      hasMarketing: undefined,
      isPublic: undefined,
      isExplicit: undefined,
    })
  })
})
