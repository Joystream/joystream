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
  opening: (id: string) => Promise<WorkingGroupOpening>
  openingApplicationRanks: (openingId: string) => Promise<Balance[]>
  expectedBlockTime: () => Promise<number>
  transactionFee: () => Promise<Balance>
  accounts: () => Subscribable<keyPairDetails[]>
  openingApplications: () => Subscribable<OpeningApplication[]>
  myCurationGroupRoles: () => Subscribable<ActiveRole[]>
  myStorageGroupRoles: () => Subscribable<ActiveRole[]>
}
