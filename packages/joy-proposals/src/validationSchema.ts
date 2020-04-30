import { ProposalType } from "./runtime";

const constraints: { [k in ProposalType]: any } = {
  Text: {},
  RuntimeUpgrade: {},
  SetElectionParameters: {},
  Spending: {},
  SetLead: {},
  SetContentWorkingGroupMintCapacity: {},
  EvictStorageProvider: {},
  SetValidatorCount: {},
  SetStorageRoleParameters: {}
};

export default constraints;
