import { Bytes } from '@polkadot/types/primitive';
import BN from 'bn.js';
import keyring from '@polkadot/ui-keyring';
import { ElectionStake, Backer } from '@joystream/types/council';
import { Options as QueryOptions } from '@polkadot/react-api/hoc/types';
import queryString from 'query-string';
import { SubmittableResult } from '@polkadot/api';
import { Codec } from '@polkadot/types/types';
import { Location } from 'history';

export const ZERO = new BN(0);

export function bnToStr (bn?: BN, dflt = ''): string {
  return bn ? bn.toString() : dflt;
}

export const notDefined = (x: any): boolean =>
  x === null || typeof x === 'undefined';

export const isDefined = (x: any): boolean =>
  !notDefined(x);

export const isDef = isDefined;

export const notDef = notDefined;

export const isObj = (x: any): boolean =>
  x !== null && typeof x === 'object';

export const isStr = (x: any): boolean =>
  typeof x === 'string';

export const isNum = (x: any): boolean =>
  typeof x === 'number';

export const isEmptyStr = (x: any): boolean =>
  notDefined(x) || (isStr(x) && (x as string).trim().length === 0);

export const nonEmptyStr = (x?: any) =>
  isStr(x) && (x as string).trim().length > 0;

export const parseNumStr = (num: string): number | undefined => {
  try {
    return parseInt(num, undefined);
  } catch (err) {
    return undefined;
  }
};

export const nonEmptyArr = (x: any): boolean =>
  Array.isArray(x) && x.length > 0;

export const isEmptyArr = (x: any): boolean =>
  !nonEmptyArr(x);

export function findNameByAddress (address: string): string | undefined {
  let keyring_address;

  try {
    keyring_address = keyring.getAccount(address);
  } catch (error) {
    try {
      keyring_address = keyring.getAddress(address);
    } catch (error) {
      // do nothing
    }
  }

  return keyring_address ? keyring_address.meta.name : undefined;
}

export function isKnownAddress (address: string): boolean {
  return isDefined(findNameByAddress(address));
}

export function calcTotalStake (stakes: ElectionStake | ElectionStake[] | undefined): BN {
  if (typeof stakes === 'undefined') {
    return ZERO;
  }

  const total = (stake: ElectionStake) => stake.new.add(stake.transferred);

  try {
    if (Array.isArray(stakes)) {
      return stakes.reduce((accum, stake) => {
        return accum.add(total(stake));
      }, ZERO);
    } else {
      return total(stakes);
    }
  } catch (err) {
    console.log('Failed to calculate a total stake', stakes, err);

    return ZERO;
  }
}

export function calcBackersStake (backers: Backer[]): BN {
  return backers.map((b) => b.stake).reduce((accum, stake) => {
    return accum.add(stake);
  }, ZERO);
}

/** Example of apiQuery: 'query.councilElection.round' */
export function queryToProp (
  apiQuery: string,
  paramNameOrOpts?: string | QueryOptions
): [string, QueryOptions] {
  let paramName: string | undefined;
  let propName: string | undefined;

  if (typeof paramNameOrOpts === 'string') {
    paramName = paramNameOrOpts;
  } else if (paramNameOrOpts) {
    paramName = paramNameOrOpts.paramName;
    propName = paramNameOrOpts.propName;
  }

  // If prop name is still undefined, derive it from the name of storage item:
  if (!propName) {
    propName = apiQuery.split('.').slice(-1)[0];
  }

  return [apiQuery, { paramName, propName }];
}

export function getUrlParam (location: Location, paramName: string, deflt: string | null = null): string | null {
  const params = queryString.parse(location.search);

  return params[paramName] ? params[paramName] as string : deflt;
}

export function filterSubstrateEventsAndExtractData (txResult: SubmittableResult, eventName: string): Codec[][] {
  const res: Codec[][] = [];

  txResult.events.forEach((event) => {
    const { event: { method, data } } = event;

    if (method === eventName) {
      res.push(data.toArray());
    }
  });

  return res;
}

export function findFirstParamOfSubstrateEvent<T extends Codec> (txResult: SubmittableResult, eventName: string): T | undefined {
  const data = filterSubstrateEventsAndExtractData(txResult, eventName);

  if (data && data.length) {
    return data[0][0] as T;
  }

  return undefined;
}

export function includeKeys<T extends { [k: string]: any }> (obj: T, ...allowedKeys: string[]) {
  return Object.keys(obj).filter((objKey) => {
    return allowedKeys.reduce(
      (hasAllowed: boolean, allowedKey: string) => hasAllowed || objKey.includes(allowedKey),
      false
    );
  });
}

export function bytesToString (bytes: Bytes) {
  return Buffer.from(bytes.toString().substr(2), 'hex').toString();
}

// Based on: https://fettblog.eu/typescript-hasownproperty/
export function isObjectWithProperties<X, Y extends PropertyKey[]> (input: X, ...props: Y): input is X & Record<Y[number], unknown> {
  return typeof input === 'object' && input !== null && props.every((prop) => prop in input);
}

export function normalizeError (e: unknown): string {
  let message: string;

  if (e instanceof Error) {
    message = e.message;
  } else if (isObjectWithProperties(e, 'toString') && typeof e.toString === 'function') {
    message = e.toString() as string;
  } else if (typeof e === 'string') {
    message = e;
  } else {
    message = JSON.stringify(e);
  }

  // Prevent returning falsely value
  return message || 'Unexpected error';
}
