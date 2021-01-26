import { ChannelMetadata } from '../src'
import { assert } from 'chai'

describe('Channel Metadata', () => {
  it('Message', () => {
    const channel = new ChannelMetadata()

    const title = 'title'
    const description = 'description'
    const isPublic = false
    const language = 'fr'

    channel.setTitle(title)
    channel.setDescription(description)
    channel.setIsPublic(isPublic)
    channel.setLanguage(language)

    assert.deepEqual(channel.toObject(), {
      title,
      description,
      isPublic,
      language,
    })

    assert.deepEqual(ChannelMetadata.deserializeBinary(channel.serializeBinary()), channel)
  })
})
