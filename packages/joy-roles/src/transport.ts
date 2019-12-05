import { Role } from '@joystream/types/roles';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"

export interface ITransport {
  roles: () => Promise<Array<Role>>
  curationGroup: () => Promise<WorkingGroupProps>
  storageGroup: () => Promise<StorageAndDistributionProps>
}
