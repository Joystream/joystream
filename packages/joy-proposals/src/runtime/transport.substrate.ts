import Transport from "./transport";
import { u64 } from "@polkadot/types";
import { ApiProps } from "@polkadot/react-api/types";
import { ApiPromise } from "@polkadot/api";

export default class SubstrateTransport extends Transport {
  protected api: ApiPromise;

  constructor(api: ApiProps) {
    super();

    if (!api) {
      throw new Error("Cannot create SubstrateTransport: A Substrate API is required");
    } else if (!api.isApiReady) {
      throw new Error("Cannot create a SubstrateTransport: The Substrate API is not ready yet.");
    }

    this.api = api.api;
  }

  get proposalEngine() {
    return this.api.query.proposalEngine;
  }

  get proposalCodex() {
    return this.api.query.codex;
  }

  async proposalCount() {
    return this.proposalEngine.proposalCount();
  }

  async proposalById(proposalId: u64) {
    return this.proposalEngine.proposals(proposalId);
  }

  async proposals() {
    const count = await this.proposalCount();
    return Promise.all(Array.from({ length: Number(count.toString()) }, (_, i) => this.proposalEngine.proposalById(i)));
  }

  async hasVotedOnProposal(proposalId: u64, memberId: u64) {
    return this.proposalEngine.voteExistsByProposalByVoter(proposalId, memberId);
  }

  async activeProposals() {
    const activeProposalsIds = this.proposalEngine.activeProposalsIds();
    return Promise.all(activeProposalsIds.map((id: u64) => this.proposalById(id)));
  }

  async proposedBy(memberId: u64) {}
}
