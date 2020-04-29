import { ProposalType } from "../Proposal/ProposalTypePreview";
import { Profile } from "@joystream/types/members";
import { ProposalParametersType, ProposalId } from "@joystream/types/proposals";

export type ParsedProposal = {
  id: ProposalId;
  type: ProposalType;
  title: string;
  description: string;
  status: any;
  proposer: Profile;
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
