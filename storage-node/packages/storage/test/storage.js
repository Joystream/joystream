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

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const expect = chai.expect

const fs = require('fs')

const { Storage } = require('@joystream/storage-node-backend')

const IPFS_CID_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/

function write(store, contentId, contents, callback) {
  store
    .open(contentId, 'w')
    .then((stream) => {
      stream.on('finish', () => {
        stream.commit()
      })
      stream.on('committed', callback)

      if (!stream.write(contents)) {
        stream.once('drain', () => stream.end())
      } else {
        process.nextTick(() => stream.end())
      }
    })
    .catch((err) => {
      expect.fail(err)
    })
}

function readAll(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', (err) => reject(err))
    stream.resume()
  })
}

function createKnownObject(contentId, contents, callback) {
  let hash
  const store = Storage.create({
    resolve_content_id: () => {
      return hash
    },
  })

  write(store, contentId, contents, (theHash) => {
    hash = theHash

    callback(store, hash)
  })
}

describe('storage/storage', () => {
  let storage
  before(async () => {
    storage = await Storage.create({ timeout: 1900 })
  })

  describe('open()', () => {
    it('can write a stream', (done) => {
      write(storage, 'foobar', 'test-content', (hash) => {
        expect(hash).to.not.be.undefined
        expect(hash).to.match(IPFS_CID_REGEX)
        done()
      })
    })

    // it('detects the MIME type of a write stream', (done) => {
    // 	const contents = fs.readFileSync('../../storage-node_new.svg')
    // 	storage
    // 		.open('mime-test', 'w')
    // 		.then((stream) => {
    // 			let fileInfo
    // 			stream.on('fileInfo', (info) => {
    // 				// Could filter & abort here now, but we're just going to set this,
    // 				// and expect it to be set later...
    // 				fileInfo = info
    // 			})
    //
    // 			stream.on('finish', () => {
    // 				stream.commit()
    // 			})
    //
    // 			stream.on('committed', () => {
    // 				// ... if fileInfo is not set here, there's an issue.
    // 				expect(fileInfo).to.have.property('mimeType', 'application/xml')
    // 				expect(fileInfo).to.have.property('ext', 'xml')
    // 				done()
    // 			})
    //
    // 			if (!stream.write(contents)) {
    // 				stream.once('drain', () => stream.end())
    // 			} else {
    // 				process.nextTick(() => stream.end())
    // 			}
    // 		})
    // 		.catch((err) => {
    // 			expect.fail(err)
    // 		})
    // })

    it('can read a stream', (done) => {
      const contents = 'test-for-reading'
      createKnownObject('foobar', contents, (store) => {
        store
          .open('foobar', 'r')
          .then(async (stream) => {
            const data = await readAll(stream)
            expect(Buffer.compare(data, Buffer.from(contents))).to.equal(0)
            done()
          })
          .catch((err) => {
            expect.fail(err)
          })
      })
    })

    it('detects the MIME type of a read stream', (done) => {
      const contents = fs.readFileSync('../../storage-node_new.svg')
      createKnownObject('foobar', contents, (store) => {
        store
          .open('foobar', 'r')
          .then(async (stream) => {
            const data = await readAll(stream)
            expect(contents.length).to.equal(data.length)
            expect(Buffer.compare(data, contents)).to.equal(0)
            expect(stream).to.have.property('fileInfo')

            // application/xml+svg would be better, but this is good-ish.
            expect(stream.fileInfo).to.have.property('mimeType', 'application/xml')
            expect(stream.fileInfo).to.have.property('ext', 'xml')
            done()
          })
          .catch((err) => {
            expect.fail(err)
          })
      })
    })

    it('provides default MIME type for read streams', (done) => {
      const contents = 'test-for-reading'
      createKnownObject('foobar', contents, (store) => {
        store
          .open('foobar', 'r')
          .then(async (stream) => {
            const data = await readAll(stream)
            expect(Buffer.compare(data, Buffer.from(contents))).to.equal(0)

            expect(stream.fileInfo).to.have.property('mimeType', 'application/octet-stream')
            expect(stream.fileInfo).to.have.property('ext', 'bin')
            done()
          })
          .catch((err) => {
            expect.fail(err)
          })
      })
    })
  })

  describe('stat()', () => {
    it('times out for unknown content', async () => {
      const content = Buffer.from('this-should-not-exist')
      const x = await storage.ipfs.add(content, { onlyHash: true })
      const hash = x[0].hash

      // Try to stat this entry, it should timeout.
      expect(storage.stat(hash)).to.eventually.be.rejectedWith('timed out')
    })

    it('returns stats for a known object', (done) => {
      const content = 'stat-test'
      const expectedSize = content.length
      createKnownObject('foobar', content, (store, hash) => {
        expect(store.stat(hash)).to.eventually.have.property('size', expectedSize)
        done()
      })
    })
  })

  describe('size()', () => {
    it('times out for unknown content', async () => {
      const content = Buffer.from('this-should-not-exist')
      const x = await storage.ipfs.add(content, { onlyHash: true })
      const hash = x[0].hash

      // Try to stat this entry, it should timeout.
      expect(storage.size(hash)).to.eventually.be.rejectedWith('timed out')
    })

    it('returns the size of a known object', (done) => {
      createKnownObject('foobar', 'stat-test', (store, hash) => {
        expect(store.size(hash)).to.eventually.equal(15)
        done()
      })
    })
  })
})
