import { ChannelMetadata } from '../src'
import { assert } from 'chai'
import { encodeDecode, metaToObject } from '../src/utils'
import Long from 'long'

describe('Channel Metadata', () => {
  it('Message', () => {
    const channel = {
      title: 'title',
      description: 'description',
      isPublic: false,
      language: 'fr',
      avatarPhoto: 0,
      coverPhoto: 1,
    }
    const channelMessage = new ChannelMetadata(channel)

    assert.deepEqual(metaToObject(ChannelMetadata, channelMessage), channel)
    assert.deepEqual(encodeDecode(ChannelMetadata, channel), channel)
  })
})
