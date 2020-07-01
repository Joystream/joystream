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

'use strict';

const mocha = require('mocha');
const chai = require('chai');
const chai_as_promised = require('chai-as-promised');
chai.use(chai_as_promised);
const expect = chai.expect;

const fs = require('fs');

const { Storage } = require('@joystream/storage-node-backend');

const IPFS_CID_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

function write(store, content_id, contents, callback)
{
  store.open(content_id, 'w')
    .then((stream) => {

      stream.on('finish', () => {
        stream.commit();
      });
      stream.on('committed', callback);

      stream.write(contents);
      stream.end();
    })
    .catch((err) => {
      expect.fail(err);
    });
}

function read_all (stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', err => reject(err))
    stream.resume()
  })
}

function create_known_object(content_id, contents, callback)
{
  var hash;
  const store = Storage.create({
    resolve_content_id: () => {
      return hash;
    },
  })

  write(store, content_id, contents, (the_hash) => {
    hash = the_hash;

    callback(store, hash);
  });

}

describe('storage/storage', () => {
  var storage;
  before(async () => {
    storage = await Storage.create({ timeout: 1900 });
  });

  describe('open()', () => {
    it('can write a stream', (done) => {
      write(storage, 'foobar', 'test-content', (hash) => {
        expect(hash).to.not.be.undefined;
        expect(hash).to.match(IPFS_CID_REGEX)
        done();
      });
    });

    it('detects the MIME type of a write stream', (done) => {
      const contents = fs.readFileSync('../../storage-node_new.svg');

      create_known_object('foobar', contents, (store, hash) => {
        var file_info;
        store.open('mime-test', 'w')
          .then((stream) => {

            stream.on('file_info', (info) => {
              // Could filter & abort here now, but we're just going to set this,
              // and expect it to be set later...
              file_info = info;
            });

            stream.on('finish', () => {
              stream.commit();
            });

            stream.on('committed', (hash) => {
              // ... if file_info is not set here, there's an issue.
              expect(file_info).to.have.property('mime_type', 'application/xml');
              expect(file_info).to.have.property('ext', 'xml');

              done();
            });

            stream.write(contents);
            stream.end();
          })
          .catch((err) => {
            expect.fail(err);
          });
      });

    });

    it('can read a stream', (done) => {
      const contents = 'test-for-reading';
      create_known_object('foobar', contents, (store, hash) => {
        store.open('foobar', 'r')
          .then(async (stream) => {
            const data = await read_all(stream);
            expect(Buffer.compare(data, Buffer.from(contents))).to.equal(0);
            done();
          })
          .catch((err) => {
            expect.fail(err);
          });
      });
    });

    it('detects the MIME type of a read stream', (done) => {
      const contents = fs.readFileSync('../../storage-node_new.svg');
      create_known_object('foobar', contents, (store, hash) => {
        store.open('foobar', 'r')
          .then(async (stream) => {
            const data = await read_all(stream);
            expect(contents.length).to.equal(data.length);
            expect(Buffer.compare(data, contents)).to.equal(0);
            expect(stream).to.have.property('file_info');

            // application/xml+svg would be better, but this is good-ish.
            expect(stream.file_info).to.have.property('mime_type', 'application/xml');
            expect(stream.file_info).to.have.property('ext', 'xml');
            done();
          })
          .catch((err) => {
            expect.fail(err);
          });
      });
    });

    it('provides default MIME type for read streams', (done) => {
      const contents = 'test-for-reading';
      create_known_object('foobar', contents, (store, hash) => {
        store.open('foobar', 'r')
          .then(async (stream) => {
            const data = await read_all(stream);
            expect(Buffer.compare(data, Buffer.from(contents))).to.equal(0);

            expect(stream.file_info).to.have.property('mime_type', 'application/octet-stream');
            expect(stream.file_info).to.have.property('ext', 'bin');
            done();
          })
          .catch((err) => {
            expect.fail(err);
          });
      });
    });


  });

  describe('stat()', () => {
    it('times out for unknown content', async () => {
      const content = Buffer.from('this-should-not-exist');
      const x = await storage.ipfs.add(content, { onlyHash: true });
      const hash = x[0].hash;

      // Try to stat this entry, it should timeout.
      expect(storage.stat(hash)).to.eventually.be.rejectedWith('timed out');
    });

    it('returns stats for a known object', (done) => {
      const content = 'stat-test';
      const expected_size = content.length;
      create_known_object('foobar', 'stat-test', (store, hash) => {
        expect(store.stat(hash)).to.eventually.have.property('size', expected_size);
        done();
      });
    });
  });

  describe('size()', () => {
    it('times out for unknown content', async () => {
      const content = Buffer.from('this-should-not-exist');
      const x = await storage.ipfs.add(content, { onlyHash: true });
      const hash = x[0].hash;

      // Try to stat this entry, it should timeout.
      expect(storage.size(hash)).to.eventually.be.rejectedWith('timed out');
    });

    it('returns the size of a known object', (done) => {
      create_known_object('foobar', 'stat-test', (store, hash) => {
        expect(store.size(hash)).to.eventually.equal(15);
        done();
      });
    });
  });
});
