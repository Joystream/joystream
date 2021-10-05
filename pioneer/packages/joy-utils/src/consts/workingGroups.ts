import { WorkingGroupKey } from '@joystream/types/common';
export const apiModuleByGroup: { [k in WorkingGroupKey]: string } = {
  Storage: 'storageWorkingGroup',
  Content: 'contentWorkingGroup',
  OperationsAlpha: 'operationsWorkingGroupAlpha',
  OperationsBeta: 'operationsWorkingGroupBeta',
  OperationsGamma: 'operationsWorkingGroupGamma',
  Gateway: 'gatewayWorkingGroup',
  Distribution: 'distributionWorkingGroup'
};
