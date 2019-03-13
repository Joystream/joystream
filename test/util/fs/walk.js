'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const temp = require('temp').track();

const fs = require('fs');

const fswalk = require('joystream/util/fs/walk');

const repository = require('joystream/core/repository');

function walktest(archive, base, done)
{
  var results = new Map();

  fswalk(base, archive, (err, relname, stat, linktarget) => {
    expect(err).to.be.null;

    if (relname) {
      results.set(relname, [stat, linktarget]);
      return;
    }

    // End of data, do testing
    const entries = Array.from(results.keys());
    expect(entries).to.include('foo');
    expect(results.get('foo')[0].isDirectory()).to.be.true;

    expect(entries).to.include('bar');
    expect(results.get('bar')[0].isFile()).to.be.true;

    if (archive === fs) {
      expect(entries).to.include('quux');
      expect(results.get('quux')[0].isSymbolicLink()).to.be.true;
      expect(results.get('quux')[1]).to.equal('foo/baz');
    }

    expect(entries).to.include('foo/baz');
    expect(results.get('foo/baz')[0].isFile()).to.be.true;

    done();
  });
}

describe('util/fs/walk', function()
{
  it('reports all files in a file system hierarchy', function(done)
  {
    walktest(fs, './testdata/template', done)
  });

  it('reports all files in a repo created from a file system hierarchy', function(done)
  {
    var prefix = temp.mkdirSync('joystream-walk-test');
    var repo = new repository.Repository(prefix); // hyperdrive
    repo.on('ready', () => {
      repo.populate('./testdata/template', (err) => {
        // When the repository is populated, walking it should be much the same
        // as walking the original file system.
        walktest(repo.archive, '/', done);
      });
    });
  });
});
