'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const keys = require('joystream/crypto/keys');

describe('keys', function()
{
  describe('parsing', function()
  {
    it('fails on strings of bad length', function()
    {
      expect(() => keys.parse_hex('abc')).to.throw();
    });

    it('fails on bad characters', function()
    {
      expect(() => keys.parse_hex('0xyz')).to.throw();
    });

    it('parses a hexadecimal string', function()
    {
      var buf = keys.parse_hex('0xdeadbeef');
      expect(buf).to.have.length(4);
      expect(buf[0]).to.equal(0xde);
      expect(buf[1]).to.equal(0xad);
      expect(buf[2]).to.equal(0xbe);
      expect(buf[3]).to.equal(0xef);
    });

    it('parses a hexadecimal string without 0x prefix', function()
    {
      var buf = keys.parse_hex('deadbeef');
      expect(buf).to.have.length(4);
      expect(buf[0]).to.equal(0xde);
      expect(buf[1]).to.equal(0xad);
      expect(buf[2]).to.equal(0xbe);
      expect(buf[3]).to.equal(0xef);
    });
  });

  describe('creating', function()
  {
    it('creates a key pair from scratch', function()
    {
      var key = keys.key_pair();
      expect(key).to.have.property('privKey');
      expect(key.privKey).to.have.length(32);

      expect(key).to.have.property('pubKey');
      expect(key.pubKey).to.have.length(33);
    });

    it('creates a key pair from a seed', function()
    {
      var key = keys.key_pair('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
      expect(key).to.have.property('privKey');
      expect(key.privKey).to.have.length(32);

      expect(key).to.have.property('pubKey');
      expect(key.pubKey).to.have.length(33);

      // More advanced
      expect(key.privKey[0]).to.equal(0xde);
      expect(key.privKey[1]).to.equal(0xad);
      expect(key.privKey[2]).to.equal(0xbe);
      expect(key.privKey[3]).to.equal(0xef);
      // ...

      expect(key.pubKey[0]).to.equal(0x02);
      expect(key.pubKey[1]).to.equal(0xc6);
      expect(key.pubKey[2]).to.equal(0xb7);
      expect(key.pubKey[3]).to.equal(0x54);
      // ...
    });

    it('fails to create a key pair from a bad seed', function()
    {
      expect(() => keys.key_pair('nick cave')).to.throw();
      expect(() => keys.key_pair('0xbad5eed')).to.throw();
    });
  });
});
