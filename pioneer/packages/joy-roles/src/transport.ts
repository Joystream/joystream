import { Subscribable } from '@polkadot/joy-utils/index';
import { Balance } from '@polkadot/types/interfaces';

import { WorkingGroupMembership, GroupLeadStatus } from './tabs/WorkingGroup';
import { WorkingGroupOpening } from './tabs/Opportunities';
import { keyPairDetails } from './flows/apply';
import { ActiveRole, OpeningApplication } from './tabs/MyRoles';
import { WorkingGroups } from './working_groups';

export interface ITransport {
  groupLeadStatus: (group: WorkingGroups) => Promise<GroupLeadStatus>;
  curationGroup: () => Promise<WorkingGroupMembership>;
  storageGroup: () => Promise<WorkingGroupMembership>;
  currentOpportunities: () => Promise<Array<WorkingGroupOpening>>;
  groupOpening: (group: WorkingGroups, id: number) => Promise<WorkingGroupOpening>;
  openingApplicationRanks: (group: WorkingGroups, openingId: number) => Promise<Balance[]>;
  expectedBlockTime: () => Promise<number>;
  blockHash: (height: number) => Promise<string>;
  blockTimestamp: (height: number) => Promise<Date>;
  transactionFee: () => Promise<Balance>;
  accounts: () => Subscribable<keyPairDetails[]>;
  openingApplicationsByAddress: (address: string) => Promise<OpeningApplication[]>;
  myRoles: (address: string) => Promise<ActiveRole[]>;
  applyToOpening: (
    group: WorkingGroups,
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string
  ) => Promise<number>;
  leaveRole: (group: WorkingGroups, sourceAccount: string, id: number, rationale: string) => void;
  withdrawApplication: (group: WorkingGroups, sourceAccount: string, id: number) => void;
}
