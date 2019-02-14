'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const ranges = require.main.require('lib/util/ranges');

describe('ranges', function()
{
  describe('parse()', function()
  {
    it('should parse a full range', function()
    {
      // Range with unit
      var range = ranges.parse('bytes=0-100');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-100');
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(100);

      // Range without unit
      var range = ranges.parse('0-100');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-100');
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(100);

      // Range with custom unit
      //
      var range = ranges.parse('foo=0-100');
      expect(range.unit).to.equal('foo');
      expect(range.range_str).to.equal('0-100');
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(100);
    });

    it('should error out on malformed strings', function()
    {
      expect(() => ranges.parse('foo')).to.throw();
      expect(() => ranges.parse('foo=bar')).to.throw();
      expect(() => ranges.parse('foo=100')).to.throw();
      expect(() => ranges.parse('foo=100-0')).to.throw();
    });

    it('should parse a range without end', function()
    {
      var range = ranges.parse('0-');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-');
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.be.undefined;
    });

    it('should parse a range without start', function()
    {
      var range = ranges.parse('-100');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('-100');
      expect(range.ranges[0][0]).to.be.undefined;
      expect(range.ranges[0][1]).to.equal(100);
    });

    it('should parse multiple ranges', function()
    {
      var range = ranges.parse('0-10,30-40,60-80');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-10,30-40,60-80');
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(10);
      expect(range.ranges[1][0]).to.equal(30);
      expect(range.ranges[1][1]).to.equal(40);
      expect(range.ranges[2][0]).to.equal(60);
      expect(range.ranges[2][1]).to.equal(80);
    });

    it('should merge overlapping ranges', function()
    {
      // Two overlapping ranges
      var range = ranges.parse('0-20,10-30');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-20,10-30');
      expect(range.ranges).to.have.lengthOf(1);
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(30);

      // Three overlapping ranges
      var range = ranges.parse('0-15,10-25,20-30');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-15,10-25,20-30');
      expect(range.ranges).to.have.lengthOf(1);
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(30);

      // Three overlapping ranges, reverse order
      var range = ranges.parse('20-30,10-25,0-15');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('20-30,10-25,0-15');
      expect(range.ranges).to.have.lengthOf(1);
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(30);

      // Adjacent ranges
      var range = ranges.parse('0-10,11-20');
      expect(range.unit).to.equal('bytes');
      expect(range.range_str).to.equal('0-10,11-20');
      expect(range.ranges).to.have.lengthOf(1);
      expect(range.ranges[0][0]).to.equal(0);
      expect(range.ranges[0][1]).to.equal(20);
    });
  });
});
