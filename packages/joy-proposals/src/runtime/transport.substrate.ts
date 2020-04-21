import Transport from "./transport";
import { Proposal, ProposalId } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";
import { ApiProps } from "@polkadot/react-api/types";
import { u32, bool } from "@polkadot/types/";
import { Codec } from "@polkadot/types/types";
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
    return this.proposalEngine.proposalCount<u32>();
  }

  async proposalById(proposalId: ProposalId) {
    return this.proposalEngine.proposals<any>(proposalId);
  }

  async proposalsIds() {
    const total: number = (await this.proposalCount()).toBn().toNumber();
    return Array.from({ length: total }, (_, i) => new ProposalId(i));
  }

  async proposals() {
    const ids = await this.proposalsIds();
    return Promise.all(ids.map((id) => this.proposalById(id)));
  }

  async hasVotedOnProposal(proposalId: ProposalId, voterId: MemberId) {
    return await this.proposalEngine.voteExistsByProposalByVoter<bool>(proposalId, voterId);
  }

  async activeProposals() {
    const activeProposalsIds = await this.proposalEngine.activeProposalsIds<ProposalId[]>();

    return Promise.all(activeProposalsIds.map((id) => this.proposalById(id)));
  }

  async proposedBy(member: MemberId) {
    let proposals = await this.proposals();
    return proposals.filter(({ proposerId }: Proposal) => proposerId.eq(member));
  }
}
