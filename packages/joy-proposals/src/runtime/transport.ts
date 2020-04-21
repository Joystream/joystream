import { u64 } from "@polkadot/types";
import { Proposal } from "@joystream/types/proposals";

type ProposalId = u64;

export default abstract class Transport {
  abstract proposals(): Promise<Proposal[]>;
}
