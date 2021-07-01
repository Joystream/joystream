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
      category: Long.fromNumber(100, true),
    }
    const channelMessage = new ChannelMetadata(channel)

    assert.deepEqual(metaToObject(ChannelMetadata, channelMessage), { ...channel, category: '100' })
    assert.deepEqual(encodeDecode(ChannelMetadata, channel), { ...channel, category: '100' })
  })

  it('Channel Metadata: Category as number', () => {
    const channel = { category: 100 as any }
    const channelMessage = new ChannelMetadata(channel)
    ChannelMetadata.verify(channelMessage)

    assert.deepEqual(metaToObject(ChannelMetadata, channelMessage), { ...channel, category: '100' })
    assert.deepEqual(encodeDecode(ChannelMetadata, channel), { ...channel, category: '100' })
  })
})
