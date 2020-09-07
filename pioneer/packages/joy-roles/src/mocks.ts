import { IMembership } from '@joystream/types/members';

import { createType } from '@joystream/types';

export function mockProfile (name: string, avatar_uri = ''): IMembership {
  return createType('Membership', {
    handle: name,
    avatar_uri: avatar_uri,
    root_account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp',
    controller_account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'
  });
}

export const mockStage = createType('OpeningStage', {
  Active: {
    stage: createType('ActiveOpeningStage', {
      AcceptingApplications: {
        started_accepting_applicants_at_block: 100
      }
    })
  }
});
