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

import { ThreadId, PostId } from '@joystream/types/common';
import { Proposal, ProposalId, VoteKind, DiscussionThread, DiscussionPost, ProposalDetails } from '@joystream/types/proposals';
import { MemberId } from '@joystream/types/members';
import { u32, u64, Bytes, Vec } from '@polkadot/types/';
import { BalanceOf } from '@polkadot/types/interfaces';

import { bytesToString } from '../functions/misc';
import _ from 'lodash';
import { metadata as proposalsConsts, apiMethods as proposalsApiMethods } from '../consts/proposals';
import { FIRST_MEMBER_ID } from '../consts/members';

import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import ChainTransport from './chain';
import CouncilTransport from './council';

import { blake2AsHex } from '@polkadot/util-crypto';
import { APIQueryCache } from '../APIQueryCache';

type ProposalDetailsCacheEntry = {
  type: ProposalType;
  details: any[];
}
type ProposalDetailsCache = {
  [id: number]: ProposalDetailsCacheEntry | undefined;
}

export default class ProposalsTransport extends BaseTransport {
  private membersT: MembersTransport;
  private chainT: ChainTransport;
  private councilT: CouncilTransport;
  private proposalDetailsCache: ProposalDetailsCache = {};

  constructor (
    api: ApiPromise,
    cacheApi: APIQueryCache,
    membersTransport: MembersTransport,
    chainTransport: ChainTransport,
    councilTransport: CouncilTransport
  ) {
    super(api, cacheApi);
    this.membersT = membersTransport;
    this.chainT = chainTransport;
    this.councilT = councilTransport;
  }

  proposalCount () {
    return this.proposalsEngine.proposalCount() as Promise<u32>;
  }

  rawProposalById (id: ProposalId) {
    return this.proposalsEngine.proposals(id) as Promise<Proposal>;
  }

  rawProposalDetails (id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id) as Promise<ProposalDetails>;
  }

  cancellationFee (): number {
    return (this.api.consts.proposalsEngine.cancellationFee as BalanceOf).toNumber();
  }

  async typeAndDetails (id: ProposalId) {
    const cachedProposalDetails = this.proposalDetailsCache[id.toNumber()];
    // Avoid fetching runtime upgrade proposal details if we already have them cached
    if (cachedProposalDetails) {
      return cachedProposalDetails;
    } else {
      // TODO: The right typesafe handling with JoyEnum would be very useful here
      const rawDetails = await this.rawProposalDetails(id);
      const type = rawDetails.type as ProposalType;
      let details: any[];
      if (type === 'RuntimeUpgrade') {
        // In case of RuntimeUpgrade proposal we override details to just contain the hash and filesize
        // (instead of full WASM bytecode)
        const wasm = rawDetails.value as Bytes;
        details = [blake2AsHex(wasm, 256), wasm.length];
      } else {
        const detailsJSON = rawDetails.value.toJSON();
        details = Array.isArray(detailsJSON) ? detailsJSON : [detailsJSON];
      }
      // Save entry in cache
      this.proposalDetailsCache[id.toNumber()] = { type, details };

      return { type, details };
    }
  }

  async proposalById (id: ProposalId): Promise<ParsedProposal> {
    const { type, details } = await this.typeAndDetails(id);
    const rawProposal = await this.rawProposalById(id);
    const proposer = (await this.membersT.expectedMembership(rawProposal.proposerId)).toJSON() as ParsedMember;
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
    const activeProposalIds = (await this.proposalsEngine.activeProposalIds()) as Vec<ProposalId>;

    return Promise.all(activeProposalIds.map(id => this.proposalById(id)));
  }

  async proposedBy (member: MemberId) {
    const proposals = await this.proposals();
    return proposals.filter(({ proposerId }) => member.eq(proposerId));
  }

  async voteByProposalAndMember (proposalId: ProposalId, voterId: MemberId): Promise<VoteKind | null> {
    const vote = (await this.proposalsEngine.voteExistsByProposalByVoter(proposalId, voterId)) as VoteKind;
    const hasVoted = (await this.api.query.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes (proposalId: ProposalId): Promise<ProposalVotes> {
    const voteEntries = await this.doubleMapEntries(
      'proposalsEngine.voteExistsByProposalByVoter', // Double map of intrest
      proposalId, // First double-map key value
      (v) => new VoteKind(v), // Converter from hex
      async () => (await this.membersT.nextMemberId()), // A function that returns the number of iterations to go through when chekcing possible values for the second double-map key (memberId)
      FIRST_MEMBER_ID.toNumber() // Min. possible value for second double-map key (memberId)
    );

    const votesWithMembers: ProposalVote[] = [];
    for (const voteEntry of voteEntries) {
      const memberId = voteEntry.secondKey;
      const vote = voteEntry.value;
      const parsedMember = (await this.membersT.expectedMembership(memberId)).toJSON() as ParsedMember;
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

  async parametersFromProposalType (type: ProposalType) {
    const methods = proposalsApiMethods[type];
    let votingPeriod = 0;
    let gracePeriod = 0;
    if (methods) {
      votingPeriod = ((await this.proposalsCodex[methods.votingPeriod]()) as u32).toNumber();
      gracePeriod = ((await this.proposalsCodex[methods.gracePeriod]()) as u32).toNumber();
    }
    // Currently it's same for all types, but this will change soon (?)
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
    return this.api.query.proposalsEngine.proposals(id, callback);
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
        author: (await this.membersT.expectedMembership(post.author_id)),
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
