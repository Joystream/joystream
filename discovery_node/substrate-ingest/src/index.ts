/* eslint-disable header/header */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

// Required imports
import { registerJoystreamTypes } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import Config from './config';

async function main () {
  
  // Initialise the provider to connect to the local node
  registerJoystreamTypes();
  
  const config = new Config();
  const provider = new WsProvider(config.provider_url);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });
  
  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
}

main().catch(console.error).finally(() => process.exit());