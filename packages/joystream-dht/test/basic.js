'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const { JoystreamDHT } = require('../lib');

describe('Basic DHT functionality', () => {
  it('will resolve its own port', function(done) {
    this.timeout(10000);

    // DHT syncs on 1234, sync port is 4321
    const dht = new JoystreamDHT('foobar', 1234, { asdf: 4321 });
    dht.resolve('foobar', (result) => {
      // Can't easily test on public IP, so stick with port.
      const ports = result.map(entry => entry.port);
      expect(ports).to.contain(4321);
      done();
    });
  });
});
