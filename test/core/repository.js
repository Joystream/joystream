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
const expect = require('chai').expect;
const temp = require('temp').track();

const repository = require('joystream/core/repository');

function write_mode(store, filename, mode, content, cb)
{
  store.open(filename, mode, (err, mime, stream) =>
  {
    expect(err).to.be.null;
    stream.write(content, 'utf8', (err) =>
    {
      stream.on('finish', () => {
        cb(err);
      });
      stream.end();
    });
  });
}

function write(store, filename, content, cb)
{
  write_mode(store, filename, 'w', content, cb);
}

function append(store, filename, content, cb)
{
  write_mode(store, filename, 'a', content, cb);
}

function read(store, filename, cb)
{
  store.open(filename, 'r', (err, mime, stream) =>
  {
    stream.on('readable', () => {
      expect(err).to.be.null;
      var content = stream.read();
      if (content instanceof Buffer) {
        content = content.toString('utf8');
      }
      cb(content);
    });
  });
}




function tests(backend)
{
  return () => {
    var prefix;

    beforeEach(() => {
      prefix = temp.mkdirSync('joystream-repository-test');
    });

    function new_repo(cb)
    {
      var s = new repository.Repository(prefix, backend == 'fs');
      if (cb) {
        s.on('ready', () => {
          cb(s);
        });
      }
      expect(s).to.be.an.instanceof(repository.Repository);
      return s;
    }

    describe('creation', function()
    {
      it('can create a repository instance', function()
      {
        new_repo();
      });

      it('can re-use an existing storage instrance', function()
      {
        var s1 = new_repo();
        var s2 = new_repo();
        expect(s1.storage_path).to.equal(s2.storage_path);
      });

      it('can provide stats for the root directory when newly created', function(done)
      {
        var s = new_repo();
        s.stat('/', false, function(err, stats, type)
        {
          // No errors, no mime type
          expect(err).to.be.null;
          expect(type).to.be.null;

          // Stats must contain a mode, at least.
          expect(stats).to.be.an.instanceof(Object);
          expect(stats.mode).to.not.be.undefined;

          done();
        });
      });

      it('cannot provide a mime type for the root directory', function(done)
      {
        var s = new_repo();
        s.stat('/', true, function(err, stats, type)
        {
          // No errors, no mime type - even though it was requested.
          expect(err).to.be.null;
          expect(type).to.be.null;

          done();
        });

      });
    });


    describe('I/O', function()
    {
      it('can write a file', function(done)
      {
        var s = new_repo();
        write(s, 'test-1', 'Hello, world!', done);
      });

      it('can write a file in a subdirectory that did not exist before', function(done)
      {
        var s = new_repo();
        write(s, 'testdir/test-1', 'Hello, world!', done);
      });

      it('can read a written file', function(done)
      {
        var s = new_repo();
        write(s, 'test-2', 'Hello, world!', (err) => {
          expect(err).to.be.undefined;
          read(s, 'test-2', (data) => {
            if (data === null) return; // ignore
            expect(data).to.equal('Hello, world!');
            done();
          });
        });
      });

      /*
      TODO appending does not seem to work with hyperdrive.
      it('can append to a file', function(done)
      {
        var s = new_repo();
        write(s, 'test-2', 'Hello', (err) => {
          expect(err).to.be.undefined;
          append(s, 'test-2', ', world!', (err) => {
            read(s, 'test-2', (data) => {
              if (data === null) return; // ignore
              expect(data).to.equal('Hello, world!');
              done();
            });
          });
        });
      });
      */

      it('can get the size of a written file', function(done)
      {
        var s = new_repo();
        write(s, 'test-3', 'Hello, world!', (err) => {
          expect(err).to.be.undefined;
          s.size('test-3', (err, size) => {
            expect(size).to.equal(13);
            done();
          });
        });
      });
    });


    describe('filesystem semantics', function()
    {
      it('can generate a directory listing', function(done)
      {
        // First write something
        var s = new_repo();
        write(s, 'test-3', 'Hello, world!', (err) => {
          expect(err).to.be.undefined;
          s.list('/', (err, files) => {
            expect(err).to.be.null;

            expect(files).to.be.an.instanceof(Array)
              .that.has.lengthOf(1);
            expect(files[0]).to.equal('test-3');

            done();
          });
        });
      });

      it('can create direcotires', function(done)
      {
        // First create a directory
        var s = new_repo();
        s.mkdir('test-4', (err) => {
          expect(err).to.be.null;
          s.stat('/test-4', false, (err, stats, type) => {
            expect(err).to.be.null;

            expect(stats.isDirectory()).to.be.true;
            done();
          });
        });
      });
    });

    describe('templating', function()
    {
      it('can create a repository from a function template', function(done)
      {
        new_repo((repo) => {
          repo.populate((r, commit) => {
            r.open('/foo', 'w', (err, mime, stream) => {
              expect(err).to.be.null;

              stream.write('Hello, world!');
              stream.end(undefined, undefined, commit);
            });
          }, (err) => {
            expect(err).to.be.undefined;

            // At this point, we can check the repo for a file list.
            repo.list('/', (err, files) => {
              expect(files).to.have.lengthOf(1);
              expect(files[0]).to.equal('foo');
              done();
            });
          });
        });
      });

      it('can create a repository from a path template', function(done)
      {
        new_repo((repo) => {
          repo.populate('./testdata/template', (err) =>
          {
            expect(err).to.be.undefined;

            // At this point, we can check the repo for a file list.
            repo.list('/', (err, files) => {
              expect(files).to.have.lengthOf(2);
              expect(files).to.include('foo');
              expect(files).to.include('bar');
              // ignore symlink: expect(files).to.include('quux');

              repo.list('/foo', (err, files) => {
                expect(files).to.have.lengthOf(1);
                expect(files).to.include('baz');
                done();
              });
            });
          });
        });
      });
    });

  };
}

describe('core/repository', function()
{
  describe('filesystem backend', tests('fs'));
  describe('hyperdrive backend', tests('hyperdrive'));
});
