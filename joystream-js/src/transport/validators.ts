import BaseTransport from './base'

export default class ValidatorsTransport extends BaseTransport {
  async maxCount(): Promise<number> {
    const count = (await this.api.query.staking.validatorCount()).toNumber()

    return count
  }
}
