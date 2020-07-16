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
import { u32, u64, Bytes } from '@polkadot/types/';
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

export default class ProposalsTransport extends BaseTransport {
  private membersT: MembersTransport;
  private chainT: ChainTransport;
  private councilT: CouncilTransport;
  private runtimeUpgradeProposalDetailsCache: { [id: number]: [string, number] | undefined } = {};

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

  private runtimeUpgradeProposalCachedDetails (id: ProposalId) {
    return this.runtimeUpgradeProposalDetailsCache[id.toNumber()];
  }

  private runtimeUpgradeProposalDetails (id: ProposalId, wasm: Bytes): [string, number] {
    const cachedDetails = this.runtimeUpgradeProposalCachedDetails(id);

    if (cachedDetails) {
      return cachedDetails;
    }

    const details: [string, number] = [blake2AsHex(wasm, 256), wasm.length];
    this.runtimeUpgradeProposalDetailsCache[id.toNumber()] = details;

    return details;
  }

  async proposalById (id: ProposalId): Promise<ParsedProposal> {
    let details: any[] = []; let type: ProposalType;
    const cachedRuntimeProposalDetails = this.runtimeUpgradeProposalCachedDetails(id);
    // Avoid fetching runtime upgrade proposal details if we already have them cached
    if (cachedRuntimeProposalDetails) {
      type = 'RuntimeUpgrade';
      details = cachedRuntimeProposalDetails;
    } else {
      // TODO: The right typesafe handling with JoyEnum would be very useful here
      const rawDetails = await this.proposalDetailsById(id) as ProposalDetails;
      type = rawDetails.type as ProposalType;

      if (type === 'RuntimeUpgrade') {
        // In case of RuntimeUpgrade proposal we override details to just contain the hash and filesize
        // (instead of full WASM bytecode)
        details = this.runtimeUpgradeProposalDetails(id, rawDetails.value as Bytes);
      } else {
        const detailsJSON = rawDetails.value.toJSON();
        details = Array.isArray(detailsJSON) ? detailsJSON : [detailsJSON];
      }
    }
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

  async parametersFromProposalType (type: ProposalType) {
    const { votingPeriod: votingPeriodMethod, gracePeriod: gracePeriodMethod } = proposalsApiMethods[type];
    // TODO: Remove the fallback after outdated proposals are removed
    const votingPeriod = this.proposalsCodex[votingPeriodMethod]
      ? ((await this.proposalsCodex[votingPeriodMethod]()) as u32).toNumber()
      : 0;
    const gracePeriod = this.proposalsCodex[gracePeriodMethod]
      ? ((await this.proposalsCodex[gracePeriodMethod]()) as u32).toNumber()
      : 0;
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
