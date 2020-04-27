import { ProposalType } from "../Proposal/ProposalTypePreview";

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
