import { Role } from '@joystream/types/roles';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"

export interface ITransport {
  roles: () => Promise<Array<Role>>
  curationGroup: () => Promise<WorkingGroupProps>
  storageGroup: () => Promise<StorageAndDistributionProps>
  currentOpportunities: () => Promise<Array<WorkingGroupOpening>>
//  opportunity: (id: string) => Promise<any> // <-- FIXME! Type
  expectedBlockTime: () => Promise<number>
}
