import { Struct } from '@polkadot/types/codec';
import { getTypeRegistry, BlockNumber, Text } from '@polkadot/types';

export class IPNSIdentity extends Text {}
export class Url extends Text {}

export class AccountInfo extends Struct {
  constructor (value?: any) {
    super({
      identity: IPNSIdentity,
      expires_at: BlockNumber
    }, value);
  }

  get identity (): IPNSIdentity {
    return this.get('identity') as IPNSIdentity;
  }

  get expires_at (): BlockNumber {
    return this.get('expires_at') as BlockNumber;
  }
}

export function registerDiscoveryTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      Url,
      IPNSIdentity,
      AccountInfo
    });
  } catch (err) {
    console.error('Failed to register custom types of discovery module', err);
  }
}
