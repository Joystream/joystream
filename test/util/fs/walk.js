'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const fswalk = require('joystream/util/fs/walk');

describe('fs/walk', function()
{
  it('reports all files in a file system hierarchy', function(done)
  {
    var results = new Map();
    fswalk('./testdata/template', (err, relname, stat, linktarget) => {
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

      expect(entries).to.include('quux');
      expect(results.get('quux')[0].isSymbolicLink()).to.be.true;
      expect(results.get('quux')[1]).to.equal('foo/baz');

      expect(entries).to.include('foo/baz');
      expect(results.get('foo/baz')[0].isFile()).to.be.true;

      done();
    });
  });
});
