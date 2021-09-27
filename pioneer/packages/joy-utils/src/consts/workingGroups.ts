import { WorkingGroupKey } from '@joystream/types/common';
export const apiModuleByGroup: { [k in WorkingGroupKey]: string } = {
  Storage: 'storageWorkingGroup',
  Content: 'contentDirectoryWorkingGroup',
  OperationsAlpha: 'operationsWorkingGroupAlpha',
  OperationsBeta: 'operationsWorkingGroupBeta',
  OperationsGamma: 'operationsWorkingGroupGamma',
  Gateway: 'gatewayWorkingGroup'
};
