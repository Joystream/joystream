import { ParsedProposal,
  ProposalType,
  ProposalTypes,
  ProposalVote,
  ProposalVotes,
  ParsedPost,
  ParsedDiscussion,
  DiscussionContraints,
  ProposalStatusFilter,
  ProposalsBatch,
  ParsedProposalDetails } from '../types/proposals';
import { ParsedMember } from '../types/members';

import BaseTransport from './base';

import { ThreadId, PostId } from '@joystream/types/common';
import { Proposal, ProposalId, VoteKind, DiscussionThread, DiscussionPost, ProposalDetails } from '@joystream/types/proposals';
import { MemberId } from '@joystream/types/members';
import { u32, Bytes, Null } from '@polkadot/types/';
import { BalanceOf } from '@polkadot/types/interfaces';

import { bytesToString } from '../functions/misc';
import _ from 'lodash';
import { metadata as proposalsConsts, apiMethods as proposalsApiMethods } from '../consts/proposals';

import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import ChainTransport from './chain';
import CouncilTransport from './council';

import { blake2AsHex } from '@polkadot/util-crypto';
import { APIQueryCache } from './APIQueryCache';

type ProposalDetailsCacheEntry = {
  type: ProposalType;
  details: ParsedProposalDetails;
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
      const rawDetails = await this.rawProposalDetails(id);
      const type = rawDetails.type;
      let details: ParsedProposalDetails = rawDetails;

      if (type === 'RuntimeUpgrade') {
        // In case of RuntimeUpgrade proposal we override details to just contain the hash and filesize
        // (instead of full WASM bytecode)
        const wasm = rawDetails.value as Bytes;

        details = [blake2AsHex(wasm, 256), wasm.length];
      }

      // Save entry in cache
      this.proposalDetailsCache[id.toNumber()] = { type, details };

      return { type, details };
    }
  }

  async proposalById (id: ProposalId, rawProposal?: Proposal): Promise<ParsedProposal> {
    const { type, details } = await this.typeAndDetails(id);

    if (!rawProposal) {
      rawProposal = await this.rawProposalById(id);
    }

    const proposer = (await this.membersT.expectedMembership(rawProposal.proposerId)).toJSON() as ParsedMember;
    const createdAtBlock = rawProposal.createdAt;
    const createdAt = await this.chainT.blockTimestamp(createdAtBlock.toNumber());
    const cancellationFee = this.cancellationFee();

    return {
      id,
      title: rawProposal.title.toString(),
      description: rawProposal.description.toString(),
      parameters: rawProposal.parameters,
      votingResults: rawProposal.votingResults,
      proposerId: rawProposal.proposerId.toNumber(),
      status: rawProposal.status,
      details,
      type,
      proposer,
      createdAtBlock: createdAtBlock.toNumber(),
      createdAt,
      cancellationFee
    };
  }

  async proposalsIds () {
    const total: number = (await this.proposalCount()).toNumber();

    return Array.from({ length: total }, (_, i) => this.api.createType('ProposalId', i + 1));
  }

  async activeProposalsIds () {
    const result = await this.entriesByIds<ProposalId, Null>(
      this.api.query.proposalsEngine.activeProposalIds
    );

    return result.map(([proposalId]) => proposalId);
  }

  async proposalsBatch (status: ProposalStatusFilter, batchNumber = 1, batchSize = 5): Promise<ProposalsBatch> {
    const ids = (status === 'Active' ? await this.activeProposalsIds() : await this.proposalsIds())
      .sort((id1, id2) => id2.cmp(id1)); // Sort by newest
    let rawProposalsWithIds = (await Promise.all(ids.map((id) => this.rawProposalById(id))))
      .map((proposal, index) => ({ id: ids[index], proposal }));

    if (status !== 'All' && status !== 'Active') {
      rawProposalsWithIds = rawProposalsWithIds.filter(({ proposal }) => {
        if (!proposal.status.isOfType('Finalized')) {
          return false;
        }

        return proposal.status.asType('Finalized').proposalStatus.type === status;
      });
    }

    const totalBatches = Math.ceil(rawProposalsWithIds.length / batchSize);

    rawProposalsWithIds = rawProposalsWithIds.slice((batchNumber - 1) * batchSize, batchNumber * batchSize);
    const proposals = await Promise.all(rawProposalsWithIds.map(({ proposal, id }) => this.proposalById(id, proposal)));

    return {
      batchNumber,
      batchSize: rawProposalsWithIds.length,
      totalBatches,
      proposals
    };
  }

  async voteByProposalAndMember (proposalId: ProposalId, voterId: MemberId): Promise<VoteKind | null> {
    const vote = (await this.proposalsEngine.voteExistsByProposalByVoter(proposalId, voterId)) as VoteKind;
    const hasVoted = (await this.api.query.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();

    return hasVoted ? vote : null;
  }

  async votes (proposalId: ProposalId): Promise<ProposalVotes> {
    const voteEntries = await this.entriesByIds<MemberId, VoteKind>(
      this.api.query.proposalsEngine.voteExistsByProposalByVoter,
      proposalId
    );

    const votesWithMembers: ProposalVote[] = [];

    for (const [memberId, vote] of voteEntries) {
      const parsedMember = (await this.membersT.expectedMembership(memberId)).toJSON() as ParsedMember;

      votesWithMembers.push({
        vote,
        member: {
          memberId,
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
    return Promise.all(ProposalTypes.map((type) => this.parametersFromProposalType(type)));
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
    const postEntries = await this.entriesByIds<PostId, DiscussionPost>(
      this.api.query.proposalsDiscussion.postThreadIdByPostId,
      threadId
    );

    const parsedPosts: ParsedPost[] = [];

    for (const [postId, post] of postEntries) {
      parsedPosts.push({
        postId: postId,
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
