import { ForumThreadMetadata } from '../src'
import { assert } from 'chai'
import { encodeDecode, metaToObject } from '../src/utils'

describe('Forum tags', () => {
  it('Skip vs unsetting', () => {
    const messageSkip = new ForumThreadMetadata()
    const messageUnset = new ForumThreadMetadata({ tags: [''] })

    assert.equal(metaToObject(ForumThreadMetadata, messageSkip).tags, undefined)
    assert.deepEqual(encodeDecode(ForumThreadMetadata, messageUnset).tags, [''])
  })
})
