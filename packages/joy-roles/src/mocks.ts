import { bool, Option, Text, u32, u64, Vec } from '@polkadot/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import { ActorInRole, Profile, EntryMethod } from '@joystream/types/members';

export function mockProfile(name: string, avatar_uri: string = ""): Profile {
  return {
    handle: new Text(name),
    avatar_uri: new Text(avatar_uri),
    about: new Text(""),
    registered_at_block: new u32(0),
    registered_at_time: new u64(0),
    entry: new EntryMethod(),
    suspended: new bool(false),
    subscription: new Option(u64),
    root_account: new AccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
    controller_account: new AccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
	roles: new Vec<ActorInRole>(ActorInRole),
  }
}


