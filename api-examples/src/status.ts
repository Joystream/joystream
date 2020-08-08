// @ts-check

import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@joystream/types'
import { Seat } from '@joystream/types/council';
// import { SubscriptionResult, QueryableStorageFunction } from '@polkadot/api/promise/types';
// import { GenericAccountId } from '@polkadot/types';
import { ValidatorId } from '@polkadot/types/interfaces';

// import BN from 'bn.js';
const BN = require('bn.js');

async function main () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('ws://127.0.0.1:9944');

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider, types })

  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(`Chain ${chain} using ${nodeName} v${nodeVersion}`);

  let council = await api.query.council.activeCouncil() as unknown as Seat[];
  let validators = await api.query.session.validators() as unknown as ValidatorId[];
  let version  = await api.rpc.state.getRuntimeVersion() as any;

  console.log(`Runtime Version: ${version.authoringVersion}.${version.specVersion}.${version.implVersion}`);

  // let council: QueryableStorageFunction<Seat[], SubscriptionResult> = (await api.query.council.activeCouncil()) as unknown as Seat[]
  // let council = (await api.query.council.activeCouncil()) as unknown as Seat[];

  // number of council members
  console.log('Council size:', council.length)

  console.log('Validator count:', validators.length);

  if (validators && validators.length > 0) {
    // Retrieve the free balances for all validators
    const validatorBalances = await Promise.all(
      validators.map(authorityId => api.query.balances.account(authorityId))
    );

    let totalValidatorBalances =
      validatorBalances.reduce((total, value) => total.add(value.free), new BN(0))

    // TODO: to get the staked amounts we need to read the account lock information.
    
    console.log('Total Validator Free Balance:', totalValidatorBalances.toString());
  }

  api.disconnect();
}

main()
