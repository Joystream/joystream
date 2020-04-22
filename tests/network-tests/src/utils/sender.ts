import BN = require('bn.js');
import { ApiPromise } from '@polkadot/api';
import { Index } from '@polkadot/types/interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { KeyringPair } from '@polkadot/keyring/types';

export class Sender {
  private readonly api: ApiPromise;
  private static nonceMap: Map<string, BN> = new Map();

  constructor(api: ApiPromise) {
    this.api = api;
  }

  private async getNonce(address: string): Promise<BN> {
    let oncahinNonce: BN = new BN(0);
    if (!Sender.nonceMap.get(address)) {
      oncahinNonce = await this.api.query.system.accountNonce<Index>(address);
    }
    let nonce: BN | undefined = Sender.nonceMap.get(address);
    if (!nonce) {
      nonce = oncahinNonce;
    }
    const nextNonce: BN = nonce.addn(1);
    Sender.nonceMap.set(address, nextNonce);
    return nonce;
  }

  private clearNonce(address: string): void {
    Sender.nonceMap.delete(address);
  }

  public async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: KeyringPair,
    expectFailure = false
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const nonce: BN = await this.getNonce(account.address);
      // console.log('sending transaction from ' + account.address + ' with nonce ' + nonce);
      const signedTx = tx.sign(account, { nonce });
      await signedTx
        .send(async result => {
          if (result.status.isFinalized === true && result.events !== undefined) {
            result.events.forEach(event => {
              if (event.event.method === 'ExtrinsicFailed') {
                if (expectFailure) {
                  resolve();
                } else {
                  reject(new Error('Extrinsic failed unexpectedly'));
                }
              }
            });
            resolve();
          }
          if (result.status.isFuture) {
            console.log('nonce ' + nonce + ' for account ' + account.address + ' is in future');
            this.clearNonce(account.address);
            reject(new Error('Extrinsic nonce is in future'));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
