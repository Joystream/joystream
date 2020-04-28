export type ProposalType =
  | "EvictStorageProvider"
  | "Signal"
  | "SetStorageRoleParams"
  | "SetMaxValidatorCount"
  | "SetElectionParameters"
  | "SpendingProposal"
  | "SetWGMintCapacity"
  | "SetLead"
  | "RuntimeUpgrade";

export const ProposalTypes = [
  "EvictStorageProvider",
  "Signal",
  "SetStorageRoleParams",
  "SetMaxValidatorCount",
  "SetElectionParameters",
  "SpendingProposal",
  "SetWGMintCapacity",
  "SetLead",
  "RuntimeUpgrade"
] as const;
export type ParsedProposal = {
  type: ProposalType;
  title: string;
  description: string;
  status: any;
  proposer: any;
  proposerId: number;
  createdAtBlock: number;
  createdAt: Date;
  details: any[];
  votingResults: any;
  parameters: {
    approvalQuorumPercentage: number;
    approvalThresholdPercentage: number;
    gracePeriod: number;
    requiredStake: number;
    slashingQuorumPercentage: number;
    slashingThresholdPercentage: number;
    votingPeriod: number;
  };
};

export abstract class Transport {
  abstract proposals(): Promise<ParsedProposal[]>;
}
