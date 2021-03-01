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
    channel.setAvatarPhoto(0)
    channel.setCoverPhoto(1)
    channel.setCategoriesList([100, 200])

    assert.deepEqual(channel.toObject(), {
      title,
      description,
      isPublic,
      language,
      avatarPhoto: 0,
      coverPhoto: 1,
      categoriesList: [100, 200],
    })

    assert.deepEqual(ChannelMetadata.deserializeBinary(channel.serializeBinary()), channel)
  })
})
