import { bool, Option, Text, u32, u64, Vec } from '@polkadot/types';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';

import { IMembership, EntryMethod } from '@joystream/types/members';

import {
  AcceptingApplications,
  ActiveOpeningStage,
  OpeningStage,
  ActiveOpeningStageVariant,
  ApplicationId
} from '@joystream/types/hiring';

export function mockProfile (name: string, avatar_uri = ''): IMembership {
  return {
    handle: new Text(name),
    avatar_uri: new Text(avatar_uri),
    about: new Text(''),
    registered_at_block: new u32(0),
    registered_at_time: new u64(0),
    entry: new EntryMethod(),
    suspended: new bool(false),
    subscription: new Option(u64),
    root_account: new AccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
    controller_account: new AccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp')
  };
}

export const mockStage = new OpeningStage({
  Active: new ActiveOpeningStageVariant({
    applications_added: new (Vec.with(ApplicationId))([]),
    active_application_count: new u32(0),
    unstaking_application_count: new u32(0),
    deactivated_application_count: new u32(0),
    stage: new ActiveOpeningStage({
      AcceptingApplications: new AcceptingApplications({
        started_accepting_applicants_at_block: new u32(100)
      })
    })
  })
});
