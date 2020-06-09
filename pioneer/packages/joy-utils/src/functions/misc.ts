import { Bytes } from '@polkadot/types/primitive';

export function includeKeys<T extends { [k: string]: any }> (obj: T, ...allowedKeys: string[]) {
  return Object.keys(obj).filter(objKey => {
    return allowedKeys.reduce(
      (hasAllowed: boolean, allowedKey: string) => hasAllowed || objKey.includes(allowedKey),
      false
    );
  });
}

export function bytesToString (bytes: Bytes) {
  return Buffer.from(bytes.toString().substr(2), 'hex').toString();
}
