import {
  ParsedProposal,
  ProposalType,
  ProposalTypes,
  ProposalVote
} from "../types/proposals";
import { ParsedMember } from "../types/members";

import BaseTransport from './base';

import { Proposal, ProposalId, VoteKind } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";
import { u32 } from "@polkadot/types/";
import { BalanceOf } from "@polkadot/types/interfaces";

import { includeKeys, splitOnUpperCase } from "../functions/misc";
import { calculateStake, calculateMetaFromType } from "../functions/proposals"

import { ApiPromise } from "@polkadot/api";
import MembersTransport from "./members";
import ChainTransport from "./chain";
import CouncilTransport from "./council";

export default class ProposalsTransport extends BaseTransport {
  private membersT: MembersTransport;
  private chainT: ChainTransport;
  private councilT: CouncilTransport;

  constructor(
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

  proposalCount() {
    return this.proposalsEngine.proposalCount<u32>();
  }

  rawProposalById(id: ProposalId) {
    return this.proposalsEngine.proposals<Proposal>(id);
  }

  proposalDetailsById(id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async cancellationFee(): Promise<number> {
    return ((await this.api.consts.proposalsEngine.cancellationFee) as BalanceOf).toNumber();
  }

  async proposalById(id: ProposalId): Promise<ParsedProposal> {
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
    const cancellationFee = await this.cancellationFee();

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

  async proposalsIds() {
    const total: number = (await this.proposalCount()).toNumber();
    return Array.from({ length: total }, (_, i) => new ProposalId(i + 1));
  }

  async proposals() {
    const ids = await this.proposalsIds();
    return Promise.all(ids.map(id => this.proposalById(id)));
  }

  async activeProposals() {
    const activeProposalIds = await this.proposalsEngine.activeProposalIds<ProposalId[]>();

    return Promise.all(activeProposalIds.map(id => this.proposalById(id)));
  }

  async proposedBy(member: MemberId) {
    const proposals = await this.proposals();
    return proposals.filter(({ proposerId }) => member.eq(proposerId));
  }

  async proposalDetails(id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async voteByProposalAndMember(proposalId: ProposalId, voterId: MemberId): Promise<VoteKind | null> {
    const vote = await this.proposalsEngine.voteExistsByProposalByVoter<VoteKind>(proposalId, voterId);
    const hasVoted = (await this.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes(proposalId: ProposalId): Promise<ProposalVote[]> {
    const councilMembers = await this.councilT.councilMembers();
    return Promise.all(
      councilMembers.map(async member => {
        const vote = await this.voteByProposalAndMember(proposalId, member.memberId);
        return {
          vote,
          member
        };
      })
    );
  }

  async fetchProposalMethodsFromCodex(includeKey: string) {
    const methods = includeKeys(this.proposalsCodex, includeKey);
    // methods = [proposalTypeVotingPeriod...]
    return methods.reduce(async (prevProm, method) => {
      const obj = await prevProm;
      const period = (await this.proposalsCodex[method]()) as u32;
      // setValidatorCountProposalVotingPeriod to SetValidatorCount
      const key = splitOnUpperCase(method)
        .slice(0, -3)
        .map((w, i) => (i === 0 ? w.slice(0, 1).toUpperCase() + w.slice(1) : w))
        .join("") as ProposalType;

      return { ...obj, [`${key}`]: period.toNumber() };
    }, Promise.resolve({}) as Promise<{ [k in ProposalType]: number }>);
  }

  async proposalTypesGracePeriod(): Promise<{ [k in ProposalType]: number }> {
    return this.fetchProposalMethodsFromCodex("GracePeriod");
  }

  async proposalTypesVotingPeriod(): Promise<{ [k in ProposalType]: number }> {
    return this.fetchProposalMethodsFromCodex("VotingPeriod");
  }

  async parametersFromProposalType(type: ProposalType) {
    const votingPeriod = (await this.proposalTypesVotingPeriod())[type];
    const gracePeriod = (await this.proposalTypesGracePeriod())[type];
    const stake = calculateStake(type);
    const meta = calculateMetaFromType(type);
    // Currently it's same for all types, but this will change soon
    const cancellationFee = await this.cancellationFee();
    return {
      type,
      votingPeriod,
      gracePeriod,
      stake,
      cancellationFee,
      ...meta
    };
  }

  async proposalsTypesParameters() {
    return Promise.all(ProposalTypes.map(type => this.parametersFromProposalType(type)));
  }

  async subscribeProposal(id: number|ProposalId, callback: () => void) {
    return this.proposalsEngine.proposals(id, callback);
  }
}
