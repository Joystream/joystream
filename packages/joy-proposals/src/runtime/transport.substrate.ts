import { Transport, ParsedProposal, ProposalType, ProposalTypes, ParsedMember } from "./transport";
import { Proposal, ProposalId, Seats, VoteKind } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";
import { ApiProps } from "@polkadot/react-api/types";
import { u32, Vec } from "@polkadot/types/";
import { Balance, Moment } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";

import { includeKeys, calculateStake, calculateMetaFromType, splitOnUpperCase } from "../utils";

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

  get members() {
    return this.api.query.members;
  }

  get council() {
    return this.api.query.council;
  }

  async totalIssuance() {
    return this.api.query.balances.totalIssuance<Balance>();
  }

  async blockHash(height: number): Promise<string> {
    const blockHash = await this.api.query.system.blockHash(height);
    return blockHash.toString();
  }

  async blockTimestamp(height: number): Promise<Date> {
    const blockTime = (await this.api.query.timestamp.now.at(await this.blockHash(height))) as Moment;

    return new Date(blockTime.toNumber());
  }

  async proposalCount() {
    return this.proposalsEngine.proposalCount<u32>();
  }

  async rawProposalById(id: ProposalId) {
    return this.proposalsEngine.proposals<Proposal>(id);
  }

  async proposalDetailsById(id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  async memberProfile(id: MemberId) {
    return this.members.memberProfile(id);
  }

  async proposalById(id: ProposalId): Promise<ParsedProposal> {
    const rawDetails = (await this.proposalDetailsById(id)).toJSON() as { [k: string]: any };
    const type = Object.keys(rawDetails)[0] as ProposalType;
    const details = rawDetails[type];
    const rawProposal = await this.rawProposalById(id);
    const proposer = (await this.memberProfile(rawProposal.proposerId)).toJSON() as ParsedMember;
    const proposal = rawProposal.toJSON() as {
      title: string;
      description: string;
      parameters: any;
      votingResults: any;
      proposerId: number;
      status: any;
    };
    const createdAtBlock = rawProposal.createdAt;
    const createdAt = await this.blockTimestamp(createdAtBlock.toNumber());

    return {
      ...proposal,
      details,
      type,
      proposer,
      createdAtBlock: createdAtBlock.toJSON(),
      createdAt
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

  async councilMembers() {
    const council = (await this.council.activeCouncil()) as Seats;
    return Promise.all(
      council.map(async seat => {
        const memberIds = (await this.members.memberIdsByControllerAccountId(seat.member)) as Vec<MemberId>;
        const member = (await this.memberProfile(memberIds[0])).toJSON() as ParsedMember;
        return {
          ...member,
          memberId: memberIds[0]
        };
      })
    );
  }

  async voteByProposalAndMember(proposalId: ProposalId, voterId: MemberId) {
    const vote = await this.proposalsEngine.voteExistsByProposalByVoter<VoteKind>(proposalId, voterId);
    const hasVoted = (await this.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes(proposalId: ProposalId) {
    const councilMembers = await this.councilMembers();
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
    const issuance = (await this.totalIssuance()).toNumber();
    const stake = calculateStake(type, issuance);
    const meta = calculateMetaFromType(type);
    return {
      type,
      votingPeriod,
      gracePeriod,
      stake,
      ...meta
    };
  }

  async proposalsTypesParameters() {
    return Promise.all(ProposalTypes.map(type => this.parametersFromProposalType(type)));
  }
}
