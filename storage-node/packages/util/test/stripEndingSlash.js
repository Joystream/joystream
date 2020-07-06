'use strict'

const expect = require('chai').expect
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')

describe('stripEndingSlash', function () {
  it('stripEndingSlash should keep URL without the slash', function () {
    expect(stripEndingSlash('http://keep.one')).to.equal('http://keep.one')
  })
  it('stripEndingSlash should remove ending slash', function () {
    expect(stripEndingSlash('http://strip.one/')).to.equal('http://strip.one')
  })
})
