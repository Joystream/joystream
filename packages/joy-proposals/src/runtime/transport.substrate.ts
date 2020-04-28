import { Transport, ParsedProposal } from './transport';
import { Proposal, ProposalId, Seats, VoteKind } from '@joystream/types/proposals';
import { MemberId } from '@joystream/types/members';
import { ApiProps } from '@polkadot/react-api/types';
import { u32, bool, Vec } from '@polkadot/types/';
import { ApiPromise } from '@polkadot/api';

import { includeKeys, dateFromBlock } from '../utils';
import { ProposalType } from '../Proposal/ProposalTypePreview';

export class SubstrateTransport extends Transport {
  protected api: ApiPromise;

  constructor (api: ApiProps) {
    super();

    if (!api) {
      throw new Error('Cannot create SubstrateTransport: A Substrate API is required');
    } else if (!api.isApiReady) {
      throw new Error('Cannot create a SubstrateTransport: The Substrate API is not ready yet.');
    }

    this.api = api.api;
  }

  get proposalsEngine () {
    return this.api.query.proposalsEngine;
  }

  get proposalsCodex () {
    return this.api.query.proposalsCodex;
  }

  get members () {
    return this.api.query.members;
  }

  get council () {
    return this.api.query.council;
  }

  async proposalCount () {
    return this.proposalsEngine.proposalCount<u32>();
  }

  async rawProposalById (id: ProposalId) {
    return this.proposalsEngine.proposals<Proposal>(id);
  }

  async proposalDetailsById (id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async memberProfile (id: MemberId) {
    return this.members.memberProfile(id);
  }

  async proposalById (id: ProposalId): Promise<ParsedProposal> {
    const rawDetails = (await this.proposalDetailsById(id)).toJSON() as { [k: string]: any };
    const type = Object.keys(rawDetails)[0] as ProposalType;
    const details = rawDetails[type];
    const rawProposal = await this.rawProposalById(id);
    const proposer = (await this.memberProfile(rawProposal.proposerId)).toJSON();
    const proposal = rawProposal.toJSON() as {
      title: string;
      description: string;
      votingResults: any;
      proposerId: number;
      status: any;
    };
    const createdAtBlock = rawProposal.createdAt;

    return {
      ...proposal,
      details,
      type,
      proposer,
      createdAtBlock: createdAtBlock.toJSON(),
      createdAt: dateFromBlock(createdAtBlock)
    };
  }

  async proposalsIds () {
    const total: number = (await this.proposalCount()).toBn().toNumber();
    return Array.from({ length: total + 1 }, (_, i) => new ProposalId(i));
  }

  async proposals () {
    const ids = await this.proposalsIds();
    return Promise.all(ids.map(id => this.proposalById(id)));
  }

  async hasVotedOnProposal (proposalId: ProposalId, voterId: MemberId) {
    const hasVoted = await this.proposalsEngine.voteExistsByProposalByVoter<bool>(proposalId, voterId);
    return hasVoted.eq(true);
  }

  async activeProposals () {
    const activeProposalIds = await this.proposalsEngine.activeProposalIds<ProposalId[]>();

    return Promise.all(activeProposalIds.map(id => this.proposalById(id)));
  }

  async proposedBy (member: MemberId) {
    const proposals = await this.proposals();
    return proposals.filter(({ proposerId }) => member.eq(proposerId));
  }

  async proposalDetails (id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async councilMembers () {
    const council = await this.council.activeCouncil() as Seats;
    return Promise.all(
      council.map(async seat => {
        const memberIds = (await this.members.memberIdsByControllerAccountId(seat.member)) as Vec<MemberId>;
        const member = await this.memberProfile(memberIds[0]);
        return {
          ...member,
          memberId: memberIds[0]
        };
      })
    );
  }

  async voteByProposalAndMember (proposalId: ProposalId, voterId: MemberId) {
    const vote = await this.proposalsEngine.voteExistsByProposalByVoter<VoteKind>(proposalId, voterId);
    const hasVoted = (await this.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes () {

  }

  async proposalTypesGracePeriod () {
    const methods = includeKeys(this.proposalsCodex, 'GracePeriod');
    // methods = [proposalTypeGracePeriod...]
    return methods.reduce((obj, method) => ({ ...obj, method: this.proposalsCodex[method]() }), {});
  }

  async proposalTypesVotingPeriod () {
    const methods = includeKeys(this.proposalsCodex, 'VotingPeriod');
    // methods = [proposalTypeVotingPeriod...]
    return methods.reduce((obj, method) => ({ ...obj, method: this.proposalsCodex[method]() }), {});
  }
}
