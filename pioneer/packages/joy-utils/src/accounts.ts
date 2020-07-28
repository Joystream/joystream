import { ActionStatus } from '@polkadot/react-components/Status/types';
import { CreateResult } from '@polkadot/ui-keyring/types';
import { KeypairType } from '@polkadot/util-crypto/types';

import FileSaver from 'file-saver';
import { DEV_PHRASE } from '@polkadot/keyring/defaults';
import { InputAddress } from '@polkadot/react-components';
import keyring from '@polkadot/ui-keyring';
import { isHex, u8aToHex } from '@polkadot/util';
import { keyExtractSuri, mnemonicGenerate, mnemonicValidate, randomAsU8a } from '@polkadot/util-crypto';

import { ApiPromise } from '@polkadot/api';
import { MemberId, Membership } from '@joystream/types/members';
import { AccountId } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types/codec';

export type SeedType = 'bip' | 'raw' | 'dev';

export interface AddressState {
  address: string | null;
  deriveError: string | null;
  derivePath: string;
  isSeedValid: boolean;
  pairType: KeypairType;
  seed: string;
  seedType: SeedType;
}

const DEFAULT_PAIR_TYPE = 'ed25519'; // 'sr25519';

function deriveValidate (seed: string, derivePath: string, pairType: KeypairType): string | null {
  try {
    const { path } = keyExtractSuri(`${seed}${derivePath}`);

    // we don't allow soft for ed25519
    if (pairType === 'ed25519' && path.some(({ isSoft }): boolean => isSoft)) {
      return 'Soft derivation paths are not allowed on ed25519';
    }
  } catch (error) {
    return error.message;
  }

  return null;
}

function isHexSeed (seed: string): boolean {
  return isHex(seed) && seed.length === 66;
}

function rawValidate (seed: string): boolean {
  return ((seed.length > 0) && (seed.length <= 32)) || isHexSeed(seed);
}

function addressFromSeed (phrase: string, derivePath: string, pairType: KeypairType): string {
  return keyring
    .createFromUri(`${phrase.trim()}${derivePath}`, {}, pairType)
    .address;
}

function newSeed (seed: string | undefined | null, seedType: SeedType): string {
  switch (seedType) {
    case 'bip':
      return mnemonicGenerate();
    case 'dev':
      return DEV_PHRASE;
    default:
      return seed || u8aToHex(randomAsU8a());
  }
}

export function generateSeed (_seed: string | undefined | null, derivePath: string, seedType: SeedType, pairType: KeypairType = DEFAULT_PAIR_TYPE): AddressState {
  const seed = newSeed(_seed, seedType);
  const address = addressFromSeed(seed, derivePath, pairType);

  return {
    address,
    deriveError: null,
    derivePath,
    isSeedValid: true,
    pairType,
    seedType,
    seed
  };
}

export function updateAddress (seed: string, derivePath: string, seedType: SeedType, pairType: KeypairType): AddressState {
  const deriveError = deriveValidate(seed, derivePath, pairType);
  let isSeedValid = seedType === 'raw'
    ? rawValidate(seed)
    : mnemonicValidate(seed);
  let address: string | null = null;

  if (!deriveError && isSeedValid) {
    try {
      address = addressFromSeed(seed, derivePath, pairType);
    } catch (error) {
      isSeedValid = false;
    }
  }

  return {
    address,
    deriveError,
    derivePath,
    isSeedValid,
    pairType,
    seedType,
    seed
  };
}

export function downloadAccount ({ json, pair }: CreateResult): void {
  const blob = new Blob([JSON.stringify(json)], { type: 'application/json; charset=utf-8' });

  FileSaver.saveAs(blob, `${pair.address}.json`);
  InputAddress.setLastValue('account', pair.address);
}

export function createAccount (suri: string, pairType: KeypairType, name: string, password: string, success: string): ActionStatus {
  // we will fill in all the details below
  const status = { action: 'create' } as ActionStatus;

  try {
    const result = keyring.addUri(suri, password, { name: name.trim(), tags: [] }, pairType);
    const { address } = result.pair;

    status.account = address;
    status.status = 'success';
    status.message = success;

    downloadAccount(result);
  } catch (error) {
    status.status = 'error';
    status.message = error.message;
  }

  return status;
}

export function isPasswordValid (password: string): boolean {
  return password.length === 0 || keyring.isPassValid(password);
}

export type MemberFromAccount = { account: string; id: number; profile?: Membership };

// TODO: Use transport instead (now that it's available in joy-utils)
export async function memberFromAccount (api: ApiPromise, accountId: AccountId | string): Promise<MemberFromAccount> {
  const [memberId] =
    ((await api.query.members.memberIdsByRootAccountId(accountId)) as Vec<MemberId>)
      .concat((await api.query.members.memberIdsByControllerAccountId(accountId)) as Vec<MemberId>);
  const member = (await api.query.members.membershipById(memberId)) as Membership;

  return {
    account: accountId.toString(),
    id: memberId.toNumber(),
    profile: member.handle.isEmpty ? undefined : member
  };
}
