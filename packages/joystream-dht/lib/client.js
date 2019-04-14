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

const RpcClient = require('rpc-websockets').Client;

const debug = require('debug')('joystream-dht:client');

const TEST_TIMEOUT = 2000;


/*
 * Connects to the Joystream DHT via a websocket based JSON-RPC interface, and
 * tries to resolve all announced ports before returning results.
 */
class JoystreamDHTClient
{
  /*
   * Factory function
   */
  static connect(ws_address)
  {
    const client = new JoystreamDHTClient();
    client.connect_address = ws_address;

    return new Promise((resolve, reject) => {
      client.rpc_client = new RpcClient(ws_address, { autoconnect: false });

      client.rpc_client.on('error', (err) => {
        debug(`Error connecting to ${ws_address}:`, err);
        reject(err);
      });

      client.rpc_client.on('open', () => {
        debug(`Connected to ${ws_address}`);
        resolve(client);
      });

      client.rpc_client.connect();
    });
  }

  async lookup(address)
  {
    const results = await this.rpc_client.call('lookup', [address]);

    // For each IP address and port, we want to know what the port is all about.
    // So let's collect results by IP address/host.
    const hosts = new Map([]);
    for (var i = 0 ; i < results.length ; ++i) {
      const entry = results[i];

      var host_data = hosts.get(entry.host);
      if (!host_data) {
        host_data = new Map([]);
      }

      // Construct potential websocket addresses for the entry.
      const ws = `ws://${entry.host}:${entry.port}`;
      debug(`Testing ${ws}...`);

      // Testing is fairly simple: if the socket can be connected to as a web
      // socket, it's going to be the rpc port.
      // But we can short-circuit things because we already know one websocket
      // port we're talking to.
      if (ws == this.connect_address) {
        host_data.set('rpc_port', entry.port);
      }
      else {
        // Try to connect to the port.
        try {
          const is_rpc = await this.test_websocket(ws);
          if (is_rpc) {
            host_data('rpc_port', entry.port);
          }
        } catch (err) {
          // pass
        }
      }

      hosts.set(entry.host, host_data);
    };

    // Just filter out all hosts for which we couldn't get an RPC port.
    const filtered = new Map([]);
    hosts.forEach((val, key, map) => {
      if (val.size) {
        filtered.set(key, val);
      }
    });

    // Now we resolve each host's ports.
    const targets = [];
    filtered.forEach((val, key, map) => {
      targets.push([key, val.get('rpc_port')]);
    });

    const resolved = new Map([]);
    for (var i = 0 ; i < targets.length ; ++i) {
      try {
        const ports = await this.port_info(address, targets[i][0], targets[i][1]);
        resolved.set(targets[i][0], ports);
      } catch (err) {
        // Hmm, this shouldn't happen. We did test all RPC host/ports before.
        // So the best thing we can do is assume the host went down in the
        // meantime, and ignore it.
      }
    }

    // To object
    const res = {};
    resolved.forEach((val, key, map) => {
      res[key] = val;
    });
    return res;
  }

  /*
   * Given the RPC host and port, get port information for the address.
   * The host/port should be authoritative for the address.
   */
  async port_info(address, host, port)
  {
    const ws = `ws://${host}:${port}`;
    debug(`Getting port information for ${address} from: ${ws}`);
    const test_client = await this.get_client_by_string(ws);

    const res = await test_client.call('info', [address]);
    debug(`Got port info for ${address}:`, res);
    return res;
  }

  /*
   * Get an RPC client for the host/port or websocket connection string.
   */
  async get_client(host, port)
  {
    const ws = `ws://${host}:${port}`;
    return this.get_client_by_string(ws);
  }

  async get_client_by_string(ws)
  {
    if (ws === this.connect_address) {
      return this.rpc_client;
    }

    const test_client = new RpcClient(ws, {
      autoconnect: false,
      reconnect: false,
      handshakeTimeout: TEST_TIMEOUT,
      timeout: TEST_TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));
        test_client.close();
      }, TEST_TIMEOUT);

      test_client.on('error', (err) => {
        debug(err);
        reject(err);
        test_client.close();
      });

      test_client.on('open', () => {
        resolve(test_client);
      });

      debug('Trying to connect...');
      test_client.connect();
    });
  }

  /*
   * Test whether there's a websocket reachable behind the connection
   * string.
   */
  async test_websocket(connect_str)
  {
    // Errors from the inner promise bubble out.
    const test_client = await this.get_client_by_string(connect_str);
    test_client.close();
    return true;
  }

  /*
   * Destroy DHT client
   */
  destroy()
  {
    this.rpc_client.close();
  }
}


module.exports = {
  JoystreamDHTClient: JoystreamDHTClient,
}
