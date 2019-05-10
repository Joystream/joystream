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

const { JoystreamDHT } = require('@joystream/dht');

describe('Basic DHT functionality', () => {
  it('will resolve its own port', function(done) {
    this.timeout(60000);

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
