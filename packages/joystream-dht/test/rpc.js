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

const { JoystreamDHT } = require('..');
const { JoystreamDHTClient } = require('../client');

describe('DHT RPC functionality', () => {
  it('will connect the DHT through RPC', function(done) {
    this.timeout(60000);

    // DHT syncs on 1235, rpc port is 4321
    const dht = new JoystreamDHT('foobar2', 1235,
      { rpc_port: 4321, extra: 0xd00d },
      { add_localhost: true });

    // Client
    JoystreamDHTClient.connect('ws://localhost:4321')
      .then((client) => {
        // Look up self.
        client.lookup('foobar2')
          .then((results) => {
            expect(results).to.have.property('localhost');

            expect(results.localhost).to.have.property('dht_port');
            expect(results.localhost.dht_port).to.equal(1235);

            expect(results.localhost).to.have.property('rpc_port');
            expect(results.localhost.rpc_port).to.equal(4321);

            expect(results.localhost).to.have.property('extra');
            expect(results.localhost.extra).to.equal(0xd00d);

            dht.destroy();
            client.destroy();
            done();
          });
      });
  });
});
