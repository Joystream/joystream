'use strict';

const { JoystreamDHT } = require('../lib');

// Should announce all three ports, and resolve them
// via the RPC interface to the keys here (plus dht_port for
// the main DHT port).
var dht = new JoystreamDHT('foobar', 4321, {
  rpc_port: 1234,
  other: 6544,
}, {
  add_localhost: true,
});
