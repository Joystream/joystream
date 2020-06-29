import {
  ParsedProposal,
  ProposalType,
  ProposalTypes,
  ProposalVote,
  ProposalVotes,
  ParsedPost,
  ParsedDiscussion,
  DiscussionContraints
} from '../types/proposals';
import { ParsedMember } from '../types/members';

import BaseTransport from './base';

import { ThreadId, PostId } from '@joystream/types/forum';
import { Proposal, ProposalId, VoteKind, DiscussionThread, DiscussionPost } from '@joystream/types/proposals';
import { MemberId } from '@joystream/types/members';
import { u32, u64 } from '@polkadot/types/';
import { BalanceOf } from '@polkadot/types/interfaces';

import { includeKeys, bytesToString } from '../functions/misc';
import _ from 'lodash';
import proposalsConsts from '../consts/proposals';
import { FIRST_MEMBER_ID } from '../consts/members';

import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import ChainTransport from './chain';
import CouncilTransport from './council';

export default class ProposalsTransport extends BaseTransport {
  private membersT: MembersTransport;
  private chainT: ChainTransport;
  private councilT: CouncilTransport;

  constructor (
    api: ApiPromise,
    membersTransport: MembersTransport,
    chainTransport: ChainTransport,
    councilTransport: CouncilTransport
  ) {
    super(api);
    this.membersT = membersTransport;
    this.chainT = chainTransport;
    this.councilT = councilTransport;
  }

  proposalCount () {
    return this.proposalsEngine.proposalCount<u32>();
  }

  rawProposalById (id: ProposalId) {
    return this.proposalsEngine.proposals<Proposal>(id);
  }

  proposalDetailsById (id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  cancellationFee (): number {
    return (this.api.consts.proposalsEngine.cancellationFee as BalanceOf).toNumber();
  }

  async proposalById (id: ProposalId): Promise<ParsedProposal> {
    const rawDetails = (await this.proposalDetailsById(id)).toJSON() as { [k: string]: any };
    const type = Object.keys(rawDetails)[0] as ProposalType;
    const details = Array.isArray(rawDetails[type]) ? rawDetails[type] : [rawDetails[type]];
    const rawProposal = await this.rawProposalById(id);
    const proposer = (await this.membersT.memberProfile(rawProposal.proposerId)).toJSON() as ParsedMember;
    const proposal = rawProposal.toJSON() as {
      title: string;
      description: string;
      parameters: any;
      votingResults: any;
      proposerId: number;
      status: any;
    };
    const createdAtBlock = rawProposal.createdAt;
    const createdAt = await this.chainT.blockTimestamp(createdAtBlock.toNumber());
    const cancellationFee = this.cancellationFee();

    return {
      id,
      ...proposal,
      details,
      type,
      proposer,
      createdAtBlock: createdAtBlock.toJSON(),
      createdAt,
      cancellationFee
    };
  }

  async proposalsIds () {
    const total: number = (await this.proposalCount()).toNumber();
    return Array.from({ length: total }, (_, i) => new ProposalId(i + 1));
  }

  async proposals () {
    const ids = await this.proposalsIds();
    return Promise.all(ids.map(id => this.proposalById(id)));
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

  async voteByProposalAndMember (proposalId: ProposalId, voterId: MemberId): Promise<VoteKind | null> {
    const vote = await this.proposalsEngine.voteExistsByProposalByVoter<VoteKind>(proposalId, voterId);
    const hasVoted = (await this.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes (proposalId: ProposalId): Promise<ProposalVotes> {
    const voteEntries = await this.doubleMapEntries(
      'proposalsEngine.voteExistsByProposalByVoter', // Double map of intrest
      proposalId, // First double-map key value
      (v) => new VoteKind(v), // Converter from hex
      async () => (await this.membersT.membersCreated()), // A function that returns the number of iterations to go through when chekcing possible values for the second double-map key (memberId)
      FIRST_MEMBER_ID.toNumber() // Min. possible value for second double-map key (memberId)
    );

    const votesWithMembers: ProposalVote[] = [];
    for (const voteEntry of voteEntries) {
      const memberId = voteEntry.secondKey;
      const vote = voteEntry.value;
      const parsedMember = (await this.membersT.memberProfile(memberId)).toJSON() as ParsedMember;
      votesWithMembers.push({
        vote,
        member: {
          memberId: new MemberId(memberId),
          ...parsedMember
        }
      });
    }

    const proposal = await this.rawProposalById(proposalId);

    return {
      councilMembersLength: await this.councilT.councilMembersLength(proposal.createdAt.toNumber()),
      votes: votesWithMembers
    };
  }

  async fetchProposalMethodsFromCodex (includeKey: string) {
    const methods = includeKeys(this.proposalsCodex, includeKey);
    // methods = [proposalTypeVotingPeriod...]
    return methods.reduce(async (prevProm, method) => {
      const obj = await prevProm;
      const period = (await this.proposalsCodex[method]()) as u32;
      // setValidatorCountProposalVotingPeriod to SetValidatorCount
      const key = _.words(_.startCase(method))
        .slice(0, -3)
        .map((w, i) => (i === 0 ? w.slice(0, 1).toUpperCase() + w.slice(1) : w))
        .join('') as ProposalType;

      return { ...obj, [`${key}`]: period.toNumber() };
    }, Promise.resolve({}) as Promise<{ [k in ProposalType]: number }>);
  }

  async proposalTypesGracePeriod (): Promise<{ [k in ProposalType]: number }> {
    return this.fetchProposalMethodsFromCodex('GracePeriod');
  }

  async proposalTypesVotingPeriod (): Promise<{ [k in ProposalType]: number }> {
    return this.fetchProposalMethodsFromCodex('VotingPeriod');
  }

  async parametersFromProposalType (type: ProposalType) {
    const votingPeriod = (await this.proposalTypesVotingPeriod())[type];
    const gracePeriod = (await this.proposalTypesGracePeriod())[type];
    // Currently it's same for all types, but this will change soon
    const cancellationFee = this.cancellationFee();
    return {
      type,
      votingPeriod,
      gracePeriod,
      cancellationFee,
      ...proposalsConsts[type]
    };
  }

  async proposalsTypesParameters () {
    return Promise.all(ProposalTypes.map(type => this.parametersFromProposalType(type)));
  }

  async subscribeProposal (id: number|ProposalId, callback: () => void) {
    return this.proposalsEngine.proposals(id, callback);
  }

  async discussion (id: number|ProposalId): Promise<ParsedDiscussion | null> {
    const threadId = (await this.proposalsCodex.threadIdByProposalId(id)) as ThreadId;
    if (!threadId.toNumber()) {
      return null;
    }
    const thread = (await this.proposalsDiscussion.threadById(threadId)) as DiscussionThread;
    const postEntries = await this.doubleMapEntries(
      'proposalsDiscussion.postThreadIdByPostId',
      threadId,
      (v) => new DiscussionPost(v),
      async () => ((await this.proposalsDiscussion.postCount()) as u64).toNumber()
    );

    const parsedPosts: ParsedPost[] = [];
    for (const { secondKey: postId, value: post } of postEntries) {
      parsedPosts.push({
        postId: new PostId(postId),
        threadId: post.thread_id,
        text: bytesToString(post.text),
        createdAt: await this.chainT.blockTimestamp(post.created_at.toNumber()),
        createdAtBlock: post.created_at.toNumber(),
        updatedAt: await this.chainT.blockTimestamp(post.updated_at.toNumber()),
        updatedAtBlock: post.updated_at.toNumber(),
        authorId: post.author_id,
        author: (await this.membersT.memberProfile(post.author_id)).unwrapOr(null),
        editsCount: post.edition_number.toNumber()
      });
    }

    // Sort by creation block asc
    parsedPosts.sort((a, b) => a.createdAtBlock - b.createdAtBlock);

    return {
      title: bytesToString(thread.title),
      threadId: threadId,
      posts: parsedPosts
    };
  }

  discussionContraints (): DiscussionContraints {
    return {
      maxPostEdits: (this.api.consts.proposalsDiscussion.maxPostEditionNumber as u32).toNumber(),
      maxPostLength: (this.api.consts.proposalsDiscussion.postLengthLimit as u32).toNumber()
    };
  }
}
