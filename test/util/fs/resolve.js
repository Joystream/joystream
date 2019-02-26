'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const path = require('path');

const resolve = require('joystream/util/fs/resolve');

function tests(base)
{
  it('resolves absolute paths relative to the base', function()
  {
    const resolved = resolve(base, '/foo');
    const relative = path.relative(base, resolved);
    expect(relative).to.equal('foo');
  });

  it('allows for relative paths that stay in the base', function()
  {
    const resolved = resolve(base, 'foo/../bar');
    const relative = path.relative(base, resolved);
    expect(relative).to.equal('bar');
  });

  it('prevents relative paths from breaking out of the base', function()
  {
    expect(() => resolve(base, '../foo')).to.throw();
  });

  it('prevents long relative paths from breaking out of the base', function()
  {
    expect(() => resolve(base, '../../../foo')).to.throw();
  });

  it('prevents sneaky relative paths from breaking out of the base', function()
  {
    expect(() => resolve(base, 'foo/../../../bar')).to.throw();
  });
}

describe('fs/resolve', function()
{
  describe('slash base', function()
  {
    tests('/');
  });

  describe('empty base', function()
  {
    tests('');
  });

  describe('short base', function()
  {
    tests('/base');
  });

  describe('long base', function()
  {
    tests('/this/base/is/very/long/indeed');
  });
});
