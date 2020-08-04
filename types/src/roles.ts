import { Struct } from '@polkadot/types/codec';
import { getTypeRegistry, u32, u128 } from '@polkadot/types';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';

// We only need this type for historic reasons to read old proposal state
// that was related to the now defunct actors module
export class RoleParameters extends Struct {
  constructor (value?: any) {
    super({
      min_stake:  u128, // Balance,
      min_actors: u32,
      max_actors: u32,
      reward: u128, // Balance,
      reward_period: u32, // BlockNumber,
      bonding_period: u32, // BlockNumber,
      unbonding_period: u32, // BlockNumber,
      min_service_period: u32, // BlockNumber,
      startup_grace_period: u32, // BlockNumber,
      entry_request_fee: u128, // Balance
    }, value);
  }

  get min_stake (): Balance {
    return this.get('min_stake') as Balance;
  }
  get max_actors (): u32 {
    return this.get('max_actors') as u32;
  }
  get min_actors (): u32 {
    return this.get('min_actors') as u32;
  }
  get reward (): Balance {
    return this.get('reward') as Balance;
  }
  get reward_period (): BlockNumber {
    return this.get('reward_period') as BlockNumber;
  }
  get unbonding_period (): BlockNumber {
    return this.get('unbonding_period') as BlockNumber;
  }
  get bonding_period (): BlockNumber {
    return this.get('bonding_period') as BlockNumber;
  }
  get min_service_period (): BlockNumber {
    return this.get('min_service_period') as BlockNumber;
  }
  get startup_grace_period (): BlockNumber {
    return this.get('startup_grace_period') as BlockNumber;
  }
  get entry_request_fee (): Balance {
    return this.get('entry_request_fee') as Balance;
  }
}

export function registerRolesTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      RoleParameters,
    });
  } catch (err) {
    console.error('Failed to register custom types of roles module', err);
  }
}
