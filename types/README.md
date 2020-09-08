# `@joystream/types`

The types package is required to register the custom Substrate runtime types when working with [`@polkadot/api`](https://www.npmjs.com/package/@polkadot/api#registering-custom-types) to communicate with a Joystream full node.


## Installation

Add the package as a dependency in your project.

```shell
yarn add @joystream/types

# or

npm install --save @joystream/types
```

## Registering the types

Call `registerJoystreamTypes()` before creating a Polkadot API client.

```javascript
import { registerJoystreamTypes } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';

async function main () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944');

  // Register types before creating the API
  registerJoystreamTypes();

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // Retrieve the chain & node information information via RPC calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(`Chain ${chain} using ${nodeName} v${nodeVersion}`);
}

main();
```

## Examples

See [joystream-api-examples](https://github.com/Joystream/joystream-api-examples) for some additional examples on usage.
