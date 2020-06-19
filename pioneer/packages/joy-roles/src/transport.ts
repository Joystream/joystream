import { Subscribable } from '@polkadot/joy-utils/index';
import { Balance } from '@polkadot/types/interfaces';

import { Role } from '@joystream/types/members';

import { WorkingGroupMembership, GroupLeadStatus } from './tabs/WorkingGroup';
import { WorkingGroupOpening } from './tabs/Opportunities';
import { keyPairDetails } from './flows/apply';
import { ActiveRole, OpeningApplication } from './tabs/MyRoles';
import { WorkingGroups } from './working_groups';

export interface ITransport {
  roles: () => Promise<Array<Role>>;
  groupLeadStatus: (group: WorkingGroups) => Promise<GroupLeadStatus>;
  curationGroup: () => Promise<WorkingGroupMembership>;
  storageGroup: () => Promise<WorkingGroupMembership>;
  currentOpportunities: () => Promise<Array<WorkingGroupOpening>>;
  groupOpening: (group: WorkingGroups, id: number) => Promise<WorkingGroupOpening>;
  curationGroupOpening: (id: number) => Promise<WorkingGroupOpening>;
  openingApplicationRanks: (group: WorkingGroups, openingId: number) => Promise<Balance[]>;
  expectedBlockTime: () => Promise<number>;
  blockHash: (height: number) => Promise<string>;
  blockTimestamp: (height: number) => Promise<Date>;
  transactionFee: () => Promise<Balance>;
  accounts: () => Subscribable<keyPairDetails[]>;
  openingApplications: (address: string) => Promise<OpeningApplication[]>;
  myCurationGroupRoles: (address: string) => Promise<ActiveRole[]>;
  myStorageGroupRoles: () => Subscribable<ActiveRole[]>;
  applyToOpening: (
    group: WorkingGroups,
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string
  ) => Promise<number>;
  leaveCurationRole: (sourceAccount: string, id: number, rationale: string) => void;
  withdrawCuratorApplication: (sourceAccount: string, id: number) => void;
}
