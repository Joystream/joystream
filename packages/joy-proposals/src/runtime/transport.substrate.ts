import { Transport } from "./transport";
import { Proposal, ProposalId } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";
import { ApiProps } from "@polkadot/react-api/types";
import { u32, bool } from "@polkadot/types/";
import { ApiPromise } from "@polkadot/api";

function includeKeys<T extends { [k: string]: any }>(obj: T, ...allowedKeys: string[]) {
  return Object.keys(obj).filter(objKey => {
    return allowedKeys.reduce(
      (hasAllowed: boolean, allowedKey: string) => hasAllowed || objKey.includes(allowedKey),
      false
    );
  });
}

export class SubstrateTransport extends Transport {
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

  get proposalsEngine() {
    return this.api.query.proposalsEngine;
  }

  get proposalsCodex() {
    return this.api.query.proposalsCodex;
  }

  async proposalCount() {
    return this.proposalsEngine.proposalCount<u32>();
  }

  async proposalById(id: ProposalId) {
    return this.proposalsEngine.proposals<any>(id);
  }

  async proposalsIds() {
    const total: number = (await this.proposalCount()).toBn().toNumber();
    return Array.from({ length: total }, (_, i) => new ProposalId(i));
  }

  async proposals() {
    const ids = await this.proposalsIds();
    return Promise.all(ids.map(id => this.proposalById(id)));
  }

  async hasVotedOnProposal(proposalId: ProposalId, voterId: MemberId) {
    const hasVoted = await this.proposalsEngine.voteExistsByProposalByVoter<bool>(proposalId, voterId);
    return hasVoted.eq(true);
  }

  async activeProposals() {
    const activeProposalIds = await this.proposalsEngine.activeProposalIds<ProposalId[]>();

    return Promise.all(activeProposalIds.map(id => this.proposalById(id)));
  }

  async proposedBy(member: MemberId) {
    const proposals = await this.proposals();
    return proposals.filter(({ proposerId }: Proposal) => proposerId.eq(member));
  }

  async proposalDetails(id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async proposalTypesGracePeriod() {
    const methods = includeKeys(this.proposalsCodex, "GracePeriod");
    // methods = [proposalTypeGracePeriod...]
    return methods.reduce((obj, method) => ({ ...obj, method: this.proposalsCodex[method]() }), {});
  }

  async proposalTypesVotingPeriod() {
    const methods = includeKeys(this.proposalsCodex, "VotingPeriod");
    // methods = [proposalTypeVotingPeriod...]
    return methods.reduce((obj, method) => ({ ...obj, method: this.proposalsCodex[method]() }), {});
  }
}
