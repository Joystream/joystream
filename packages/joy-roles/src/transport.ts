import { Subscribable } from '@polkadot/joy-utils/index'
import { Balance } from '@polkadot/types/interfaces';

import { Role } from '@joystream/types/roles';

import { WorkingGroupMembership, StorageAndDistributionMembership } from "./tabs/WorkingGroup"
import { WorkingGroupOpening, } from "./tabs/Opportunities"
import { keyPairDetails } from './flows/apply'
import { ActiveRole, OpeningApplication } from './tabs/MyRoles'

export interface ITransport {
  roles: () => Promise<Array<Role>>
  curationGroup: () => Promise<WorkingGroupMembership>
  storageGroup: () => Promise<StorageAndDistributionMembership>
  currentOpportunities: () => Promise<Array<WorkingGroupOpening>>
  curationGroupOpening: (id: number) => Promise<WorkingGroupOpening>
  openingApplicationRanks: (openingId: number) => Promise<Balance[]>
  expectedBlockTime: () => Promise<number>
  blockHash: (height: number) => Promise<string>
  blockTimestamp: (height: number) => Promise<Date>
  transactionFee: () => Promise<Balance>
  accounts: () => Subscribable<keyPairDetails[]>
  openingApplications: () => Subscribable<OpeningApplication[]>
  myCurationGroupRoles: (address: string) => Promise<ActiveRole[]>
  myStorageGroupRoles: () => Subscribable<ActiveRole[]>
  applyToCuratorOpening: (id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string) => Promise<number>
  leaveCurationRole: (sourceAccount: string, id: number, rationale: string) => void
}
