import BaseTransport from './base';

export default class ChainTransport extends BaseTransport {
  async blockHash (height: number): Promise<string> {
    const blockHash = await this.api.rpc.chain.getBlockHash(height);

    return blockHash.toString();
  }

  async blockTimestamp (height: number): Promise<Date> {
    const blockTime = (await this.api.query.timestamp.now.at(await this.blockHash(height)));

    return new Date(blockTime.toNumber());
  }

  async bestBlock () {
    return await this.api.derive.chain.bestNumber();
  }
}
