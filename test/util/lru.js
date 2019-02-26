'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const lru = require('joystream/util/lru');

const DEFAULT_SLEEP = 1;
function sleep(ms = DEFAULT_SLEEP)
{
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

describe('LRUCache', function()
{
  describe('simple usage', function()
  {
    it('does not contain keys that were not added', function()
    {
      var cache = new lru.LRUCache();
      expect(cache.size()).to.equal(0);

      var val = cache.get('something');
      expect(val).to.be.undefined;

      expect(cache.has('something')).to.be.false;
    });

    it('contains keys that were added', function()
    {
      var cache = new lru.LRUCache();
      cache.put('something', 'yay!');
      expect(cache.size()).to.equal(1);

      var val = cache.get('something');
      expect(val).to.be.equal('yay!');

      expect(cache.has('something')).to.be.true;
    });

    it('does not contain keys that were deleted', function()
    {
      var cache = new lru.LRUCache();
      cache.put('something', 'yay!');
      expect(cache.size()).to.equal(1);
      var val = cache.get('something');
      expect(val).to.be.equal('yay!');
      expect(cache.has('something')).to.be.true;

      cache.del('something');
      expect(cache.size()).to.equal(0);
      val = cache.get('something');
      expect(val).to.be.undefined;
      expect(cache.has('something')).to.be.false;
    });

    it('can be cleared', function()
    {
      var cache = new lru.LRUCache();
      cache.put('something', 'yay!');
      expect(cache.size()).to.equal(1);

      cache.clear();
      expect(cache.size()).to.equal(0);
    });
  });

  describe('capacity management', function()
  {
    it('does not grow beyond capacity', async function()
    {
      var cache = new lru.LRUCache(2); // Small capacity
      expect(cache.size()).to.equal(0);

      cache.put('foo', '42');
      expect(cache.size()).to.equal(1);

      await sleep();

      cache.put('bar', '42');
      expect(cache.size()).to.equal(2);

      await sleep();

      cache.put('baz', '42');
      expect(cache.size()).to.equal(2); // Capacity exceeded
    });

    it('removes the oldest key when pruning', async function()
    {
      var cache = new lru.LRUCache(2); // Small capacity
      expect(cache.size()).to.equal(0);

      cache.put('foo', '42');
      expect(cache.size()).to.equal(1);
      expect(cache.has('foo')).to.be.true;

      await sleep();

      cache.put('bar', '42');
      expect(cache.size()).to.equal(2);
      expect(cache.has('foo')).to.be.true;
      expect(cache.has('bar')).to.be.true;

      await sleep();

      cache.put('baz', '42');
      expect(cache.size()).to.equal(2); // Capacity exceeded
      expect(cache.has('bar')).to.be.true;
      expect(cache.has('baz')).to.be.true;
    });

    it('updates LRU timestamp when reading', async function()
    {
      var cache = new lru.LRUCache(2); // Small capacity
      expect(cache.size()).to.equal(0);

      cache.put('foo', '42');
      expect(cache.size()).to.equal(1);
      expect(cache.has('foo')).to.be.true;

      await sleep();

      cache.put('bar', '42');
      expect(cache.size()).to.equal(2);
      expect(cache.has('foo')).to.be.true;
      expect(cache.has('bar')).to.be.true;

      await sleep();

      // 'foo' is older than 'bar' right now, so should be pruned first. But
      // if we get 'foo', it would be 'bar' that has to go.
      var _ = cache.get('foo');

      // Makes debugging a bit more obvious
      await sleep();

      cache.put('baz', '42');
      expect(cache.size()).to.equal(2); // Capacity exceeded
      expect(cache.has('foo')).to.be.true;
      expect(cache.has('baz')).to.be.true;
    });
  });
});
