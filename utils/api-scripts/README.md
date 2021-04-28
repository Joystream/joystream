# Joystream API Examples

Repo with examples on how to use the @joystream/types package along with @polkadot/api to communicate with a joystream full node.

Some useful utilily commands are also included under `src/`

### Directly Execute src/commands.ts

You can run typescript commands under the `src/` folder simply with:

```sh
yarn ts-node src/sudo-init-content-lead.ts
```

## Adding code to src/

For example you can add a new file `test-command.ts`:

```javascript
import { types } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'

async function main() {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944')

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider, types })

  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ])

  console.log(`Chain ${chain} using ${nodeName} v${nodeVersion}`)
}

main()
```
Then run it with:

```sh
yarn ts-node src/test-command.ts
```

### Scripts

Some examples of how to write "scripts" is available under [./scripts/](./scripts) folder.
These are "code-snippets" designed primarly for doing queries or very simple transactions.
If you follow the example format you can also copy/paste them into https://testnet.joystream.org/#/js for execution.

```sh
yarn script example
yarn script test-transfer
```
