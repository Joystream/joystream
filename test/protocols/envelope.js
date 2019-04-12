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

const envelope = require('joystream/protocols/envelope');


describe('protocols/envelope', function()
{
  it('(de-)serializes messages', function()
  {
    // Create some initial message
    const msg = envelope.serialize(42, Buffer.from('hello!'));

    // Run minimal checks
    expect(msg[0]).to.equal(42); // type
    expect(msg[1]).to.equal(0); // too small to use this byte
    expect(msg[2]).to.equal(6); // length of 'hello!'
    expect(msg.length).to.equal(35 + 6);

    // Deserialize
    const res = envelope.parse(msg);
    expect(res[0]).to.equal(42);
    expect(res[1].toString()).to.equal('hello!');
  });

  describe('parse failures', function()
  {
    it('fails on short messages', function()
    {
      expect(() => envelope.parse(Buffer.from('short'))).to.throw;
    });

    it('fails on wrong payload size', function()
    {
      const buf = Buffer.alloc(37);
      buf[2] = 99; // Too large for a 37 length message.
      expect(() => envelope.parse(buf)).to.throw;
    });

    it('fails on bad digests', function()
    {
      // Create some initial message
      const msg = envelope.serialize(42, Buffer.from('hello!'));

      expect(() => envelope.parse(msg)).not.to.throw;

      // Modify checksum to fail the parsing
      msg[msg.length - 1] += 1;
      expect(() => envelope.parse(msg)).to.throw;
    });
  });

  describe('Serializer/Deserializer', function()
  {
    it('can pipe messages from the serializer to the deserializer', function(done)
    {
      const ser = new envelope.Serializer();
      const des = new envelope.Deserializer();

      ser.pipe(des);

      ser.on('data', (data) => {
        expect(data).to.be.an.instanceOf(Buffer);
        expect(data).to.have.lengthOf(38);
        expect(data[0]).to.equal(42);
        expect(data[1]).to.equal(0);
        expect(data[2]).to.equal(3);
        expect(data[3]).to.equal('f'.charCodeAt(0));
        expect(data[4]).to.equal('o'.charCodeAt(0));
        expect(data[5]).to.equal('o'.charCodeAt(0));
      });

      des.on('data', (data) => {
        expect(data).to.have.lengthOf(2);
        expect(data[0]).to.equal(42);
        expect(data[1].toString()).to.equal('foo');
      });

      ser.write([42, Buffer.from('foo')]);
      ser.end();
      des.on('finish', () => done());
    });
  });
});
