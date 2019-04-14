DHT Client for Joystream Storage Nodes
======================================

The Joystream storage nodes use [bittorrent-dht](https://github.com/webtorrent/bittorrent-dht)
under the hood to communicate their presence on the network.

Unfortunately, this DHT requires UDP-based communications, which are not
available in the browser.

The Joystream DHT nodes therefore also run a JSON-RPC over WebSocket server
that browsers can connect to for resolving peers.

This repository contains the DHT implementation as well as a client
implementation for communication with the RPC port.

Server
------

Running a server is fairly simple, and the `webtest` folder contains a good
example of one:

```javascript
const { JoystreamDHT } = require('joystream-dht');

const peer_address = 'some string';
const dht_port = 4321;
const other_ports_to_announce = {
  rpc_port: 1234, // Provide an rpc_port field to run the RPC server
  bar: 6544,
};

// Immediately starts announcing all ports.
var dht = new JoystreamDHT(peer_address, dht_port, other_ports_to_announce);
```

Client
------

Again, the `webtest` folder providers a decent example:

```javascript
const { JoystreamDHTClient } = require('joystream-dht/client');

JoystreamDHTClient.connect('ws://localhost:1234')
  .then(async (client) => {
    const res = await client.lookup('foobar');
    // res == [ { 'localhost': { dht_port: 4321, rpc_port: 1234, bar: 6544 } } ]
  })
```
