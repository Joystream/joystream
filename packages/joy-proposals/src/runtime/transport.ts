import { u64 } from "@polkadot/types";

type ProposalId = u64;

export default abstract class Transport {
  abstract proposals(): Promise<any[]>;
  abstract async vote(voterId: u64, proposalId: ProposalId, vote: string): Promise<any>;
  abstract async createProposal(memberId: u64, title: string, description: string): Promise<any>;
  abstract async veto(proposalId: ProposalId): Promise<any>;
}
