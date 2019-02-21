'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const temp = require('temp').track();

const repository = require.main.require('joystream/repository');

function write_mode(store, filename, mode, content, cb)
{
  store.open(filename, mode, (mime, stream, err) =>
  {
    expect(err).to.be.undefined;
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
  store.open(filename, 'r', (mime, stream, err) =>
  {
    stream.on('readable', () => {
      expect(err).to.be.undefined;
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

    function new_store()
    {
      var s = new repository.Repository(prefix, backend == 'fs');
      expect(s).to.be.an.instanceof(repository.Repository);
      return s;
    }

    describe('creation', function()
    {
      it('can create a repository instance', function()
      {
        new_store();
      });

      it('can provide stats for the root directory when newly created', function(done)
      {
        var s = new_store();
        s.stat('/', false, function(stats, type, err)
        {
          // No errors, no mime type
          expect(err).to.be.undefined;
          expect(type).to.be.null;

          // Stats must contain a mode, at least.
          expect(stats).to.be.an.instanceof(Object);
          expect(stats.mode).to.not.be.undefined;

          done();
        });
      });

      it('cannot provide a mime type for the root directory', function(done)
      {
        var s = new_store();
        s.stat('/', true, function(stats, type, err)
        {
          // No errors, no mime type - even though it was requested.
          expect(err).to.be.undefined;
          expect(type).to.be.null;

          done();
        });

      });
    });


    describe('I/O', function()
    {
      it('can write a file', function(done)
      {
        var s = new_store();
        write(s, 'test-1', 'Hello, world!', done);
      });

      it('can read a written file', function(done)
      {
        var s = new_store();
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
        var s = new_store();
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
        var s = new_store();
        write(s, 'test-3', 'Hello, world!', (err) => {
          expect(err).to.be.undefined;
          s.size('test-3', (size, err) => {
            expect(size).to.equal(13);
            done();
          });
        });
      });
    });
  };
}

describe('repository', function()
{
  describe('filesystem backend', tests('fs'));
  describe('hyperdrive backend', tests('hyperdrive'));
});
