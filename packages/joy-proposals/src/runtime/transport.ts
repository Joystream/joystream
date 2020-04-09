import { u64 } from "@polkadot/types";
import { Proposal } from "@joystream/types/";
import Cache from "./cache";

type ProposalId = u64;

export default abstract class Transport {
  protected finalizedProposalCache = Cache;
  abstract allProposals(): Promise<Proposal[]>;

  abstract vote(): Promise<any>;

  abstract createProposal(): Promise<any>;

  protected simpleCache = new Map();
}
