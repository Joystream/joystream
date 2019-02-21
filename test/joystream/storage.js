'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const fs = require('fs');
// FIXME const temp = require('temp').track();
const temp = require('temp');

const storage = require.main.require('joystream/storage');
const repository = require.main.require('joystream/repository');

function matchDirent(name, matcher)
{
  return (entry) => {
    return (entry.name == name && matcher(entry));
  };
}


function pathExists(name)
{
  return new Promise(resolve => {
    setTimeout(() => {
      if (fs.existsSync(name)) resolve();
    }, 10); // Increments for checking
  });
}


describe('storage', function()
{
  // Unique prefix per test
  var prefix;
  beforeEach(() => {
    prefix = temp.mkdirSync('joystream-storage-test');
  });

  function new_storage(pool_size = undefined)
  {
    var s = new storage.Storage(prefix, pool_size);
    expect(s).to.be.an.instanceof(storage.Storage);
    if (pool_size) {
      expect(s.pool_size).to.equal(pool_size);
    }
    return s;
  }

  describe('creation', function()
  {
    it('can create a new storage structure', function()
    {
      var s = new_storage();
      expect(typeof s.id).to.equal('string');
      expect(s.id).to.have.lengthOf(36);
    });

    it('can re-use an existing storage instance', function()
    {
      var s1 = new_storage();
      var s2 = new_storage();
      expect(s1.id).to.equal(s2.id);
      expect(s1.base_path).to.equal(s2.base_path);
    });

    it('creates the storage directory layout', function()
    {
      var s = new_storage();
      const dirent = fs.readdirSync(s.base_path, { withFileTypes: true });
      expect(dirent.some(matchDirent('keys', e => e.isDirectory()))).to.be.true;
      expect(dirent.some(matchDirent('repos', e => e.isDirectory()))).to.be.true;
      expect(dirent.some(matchDirent('id', e => e.isFile()))).to.be.true;

    });
  });

  describe('managemnet', function()
  {
    it('cannot return non-existent repositories', function()
    {
      var s = new_storage();
      var r = s.get('foo');
      expect(r).to.be.undefined;
    });

    it('creates repositories', function()
    {
      var s = new_storage();
      var res = s.create();
      expect(res.repo).to.be.an.instanceof(repository.Repository);
      expect(res.id).to.have.lengthOf(36);
    });

    it('returns created repositories', function()
    {
      var s = new_storage();
      var res = s.create();
      expect(res.repo).to.be.an.instanceof(repository.Repository);
      expect(res.id).to.have.lengthOf(36);

      var repo = s.get(res.id);
      expect(repo).to.equal(res.repo); // Strict equal, yay!
    });

    it('re-initialized created repositories', async function()
    {
      var s = new_storage();
      var res = s.create();
      expect(res.repo).to.be.an.instanceof(repository.Repository);
      expect(res.id).to.have.lengthOf(36);

      // Wait for the FS to catch up
      await pathExists(res.repo.storage_path);

      // Force flushing of the LRU pool
      s.pool.clear();

      var repo = s.get(res.id);
      expect(repo).to.be.an.instanceof(repository.Repository);
    });
  });
});
