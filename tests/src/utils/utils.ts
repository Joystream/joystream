import { KeyringPair } from '@polkadot/keyring/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { IExtrinsic } from '@polkadot/types/types';
import { compactToU8a } from '@polkadot/util';
import BN = require('bn.js');

export class Utils {
  private static LENGTH_ADDRESS = 32 + 1; // publicKey + prefix
  private static LENGTH_ERA = 2; // assuming mortals
  private static LENGTH_SIGNATURE = 64; // assuming ed25519 or sr25519
  private static LENGTH_VERSION = 1; // 0x80 & version

  public static calcTxLength = (extrinsic?: IExtrinsic | null, nonce?: BN): BN => {
    return new BN(
      Utils.LENGTH_VERSION +
        Utils.LENGTH_ADDRESS +
        Utils.LENGTH_SIGNATURE +
        Utils.LENGTH_ERA +
        compactToU8a(nonce || 0).length +
        (extrinsic ? extrinsic.encodedLength : 0)
    );
  };

  public static async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    account: KeyringPair,
    nonce: BN,
    expectFailure = false
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // let nonce: BN = await this.getNonce(account.address);
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
