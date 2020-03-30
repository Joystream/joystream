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
}
