import { u64, Vec } from '@polkadot/types';

export class Credential extends u64 {}
export class CredentialSet extends Vec.with(Credential) {} // BtreeSet ?