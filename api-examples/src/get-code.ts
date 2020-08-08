import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@joystream/types'

async function main () {
  const provider = new WsProvider('ws://127.0.0.1:9944');

  const api = await ApiPromise.create({ provider, types })

  let current_block_hash = await api.rpc.chain.getBlockHash();

  console.log('getting code as of block hash', current_block_hash.toString())

  const substrateWasm = await api.query.substrate.code.at(current_block_hash.toString());
  // const substrateWasm = await api.rpc.state.getStorage('0x'+Buffer.from(':code').toString('hex'), current_block_hash);

  console.log(substrateWasm.toHex());

  api.disconnect();
}

main()
