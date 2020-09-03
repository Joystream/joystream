/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'

const expect = require('chai').expect
const mockHttp = require('node-mocks-http')
const streamBuffers = require('stream-buffers')

const ranges = require('@joystream/storage-utils/ranges')

describe('util/ranges', function () {
  describe('parse()', function () {
    it('should parse a full range', function () {
      // Range with unit
      let range = ranges.parse('bytes=0-100')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-100')
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(100)

      // Range without unit
      range = ranges.parse('0-100')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-100')
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(100)

      // Range with custom unit
      //
      range = ranges.parse('foo=0-100')
      expect(range.unit).to.equal('foo')
      expect(range.rangeStr).to.equal('0-100')
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(100)
    })

    it('should error out on malformed strings', function () {
      expect(() => ranges.parse('foo')).to.throw()
      expect(() => ranges.parse('foo=bar')).to.throw()
      expect(() => ranges.parse('foo=100')).to.throw()
      expect(() => ranges.parse('foo=100-0')).to.throw()
    })

    it('should parse a range without end', function () {
      const range = ranges.parse('0-')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-')
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.be.undefined
    })

    it('should parse a range without start', function () {
      const range = ranges.parse('-100')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('-100')
      expect(range.ranges[0][0]).to.be.undefined
      expect(range.ranges[0][1]).to.equal(100)
    })

    it('should parse multiple ranges', function () {
      const range = ranges.parse('0-10,30-40,60-80')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-10,30-40,60-80')
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(10)
      expect(range.ranges[1][0]).to.equal(30)
      expect(range.ranges[1][1]).to.equal(40)
      expect(range.ranges[2][0]).to.equal(60)
      expect(range.ranges[2][1]).to.equal(80)
    })

    it('should merge overlapping ranges', function () {
      // Two overlapping ranges
      let range = ranges.parse('0-20,10-30')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-20,10-30')
      expect(range.ranges).to.have.lengthOf(1)
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(30)

      // Three overlapping ranges
      range = ranges.parse('0-15,10-25,20-30')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-15,10-25,20-30')
      expect(range.ranges).to.have.lengthOf(1)
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(30)

      // Three overlapping ranges, reverse order
      range = ranges.parse('20-30,10-25,0-15')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('20-30,10-25,0-15')
      expect(range.ranges).to.have.lengthOf(1)
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(30)

      // Adjacent ranges
      range = ranges.parse('0-10,11-20')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('0-10,11-20')
      expect(range.ranges).to.have.lengthOf(1)
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(20)
    })

    it('should sort ranges', function () {
      const range = ranges.parse('10-30,0-5')
      expect(range.unit).to.equal('bytes')
      expect(range.rangeStr).to.equal('10-30,0-5')
      expect(range.ranges).to.have.lengthOf(2)
      expect(range.ranges[0][0]).to.equal(0)
      expect(range.ranges[0][1]).to.equal(5)
      expect(range.ranges[1][0]).to.equal(10)
      expect(range.ranges[1][1]).to.equal(30)
    })
  })

  describe('send()', function () {
    it('should send full files on request', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(200)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal('Hello, world!')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should send a range spanning the entire file on request', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [[0, 12]],
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(206)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')
        expect(res.getHeader('content-range')).to.equal('bytes 0-12/*')
        expect(res.getHeader('content-length')).to.equal('13')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal('Hello, world!')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should send a small range on request', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [[1, 11]], // Cut off first and last letter
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(206)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')
        expect(res.getHeader('content-range')).to.equal('bytes 1-11/*')
        expect(res.getHeader('content-length')).to.equal('11')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal('ello, world')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should send ranges crossing buffer boundaries', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({
        chunkSize: 3, // Setting a chunk size smaller than the range should
        // not impact the test.
      })

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [[1, 11]], // Cut off first and last letter
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(206)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')
        expect(res.getHeader('content-range')).to.equal('bytes 1-11/*')
        expect(res.getHeader('content-length')).to.equal('11')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal('ello, world')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should send multiple ranges', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [
            [1, 3],
            [5, 7],
          ], // Slice two ranges out
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(206)
        expect(res.getHeader('content-type')).to.satisfy((str) => str.startsWith('multipart/byteranges'))
        expect(res.getHeader('content-disposition')).to.equal('inline')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true

        // The buffer should contain both ranges, but with all the That would be
        // "ell" and ", w".
        // It's pretty elaborate having to parse the entire multipart response
        // body, so we'll restrict ourselves to finding lines within it.
        const body = res._getBuffer().toString()
        expect(body).to.contain('\r\nContent-Range: bytes 1-3/*\r\n')
        expect(body).to.contain('\r\nell\r\n')
        expect(body).to.contain('\r\nContent-Range: bytes 5-7/*\r\n')
        expect(body).to.contain('\r\n, w')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should deal with ranges without end', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [[5, undefined]], // Skip the first part, but read until end
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(206)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')
        expect(res.getHeader('content-range')).to.equal('bytes 5-/*')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal(', world!')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })

    it('should ignore ranges without start', function (done) {
      const res = mockHttp.createResponse({})
      const inStream = new streamBuffers.ReadableStreamBuffer({})

      // End-of-stream callback
      const opts = {
        name: 'test.file',
        type: 'application/test',
        ranges: {
          ranges: [[undefined, 5]], // Only last five
        },
      }
      ranges.send(res, inStream, opts, function (err) {
        expect(err).to.not.exist

        // HTTP handling
        expect(res.statusCode).to.equal(200)
        expect(res.getHeader('content-type')).to.equal('application/test')
        expect(res.getHeader('content-disposition')).to.equal('inline')

        // Data/stream handling
        expect(res._isEndCalled()).to.be.true
        expect(res._getBuffer().toString()).to.equal('Hello, world!')

        // Notify mocha that we're done.
        done()
      })

      // Simulate file stream
      inStream.emit('open')
      inStream.put('Hello, world!')
      inStream.stop()
    })
  })
})
