# Joystream API Examples

Repo with examples on how to use the @joystream/types package along with @polkadot/api to communicate with a joystream full node.


## Examples

```
yarn && yarn build
yarn run status
```

## Example code

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

  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(`Chain ${chain} using ${nodeName} v${nodeVersion}`);
}

main();
```

### Scripts

You can run scripts that are found in the [./scripts/](./scripts) folder:

```sh
yarn script example
```
