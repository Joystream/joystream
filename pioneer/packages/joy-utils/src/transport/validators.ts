import BaseTransport from './base';
import { u32 } from '@polkadot/types/';

export default class ValidatorsTransport extends BaseTransport {
  async maxCount (): Promise<number> {
    const count = ((await this.api.query.staking.validatorCount())).toNumber();

    return count;
  }
}
