import { Transport, ParsedProposal, ProposalType, ProposalTypes, ParsedMember, ProposalVote } from "./transport";
import { Proposal, ProposalId, Seats, VoteKind, ElectionParameters } from "@joystream/types/proposals";
import { MemberId, Profile, ActorInRole } from "@joystream/types/members";
import { ApiProps } from "@polkadot/react-api/types";
import { u32, u128, Vec, Option } from "@polkadot/types/";
import { Balance, Moment, AccountId, BlockNumber } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { RoleKeys, Role } from "@joystream/types/members";
import { FIRST_MEMBER_ID } from '@polkadot/joy-members/constants';

import { includeKeys, calculateStake, calculateMetaFromType, splitOnUpperCase } from "../utils";
import { MintId, Mint } from "@joystream/types/mint";
import { LeadId } from "@joystream/types/content-working-group";

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

  get councilElection() {
    return this.api.query.councilElection;
  }

  get actors() {
    return this.api.query.actors;
  }

  get contentWorkingGroup() {
    return this.api.query.contentWorkingGroup;
  }

  get minting() {
    return this.api.query.minting;
  }

  totalIssuance() {
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

  proposalCount() {
    return this.proposalsEngine.proposalCount<u32>();
  }

  rawProposalById(id: ProposalId) {
    return this.proposalsEngine.proposals<Proposal>(id);
  }

  proposalDetailsById(id: ProposalId) {
    return this.proposalsCodex.proposalDetailsByProposalId(id);
  }

  memberProfile(id: MemberId): Promise<Option<Profile>> {
    return this.members.memberProfile(id) as Promise<Option<Profile>>;
  }

  async proposalById(id: ProposalId): Promise<ParsedProposal> {
    const rawDetails = (await this.proposalDetailsById(id)).toJSON() as { [k: string]: any };
    const type = Object.keys(rawDetails)[0] as ProposalType;
    const details = Array.isArray(rawDetails[type]) ? rawDetails[type] : [rawDetails[type]];
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
      id,
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

  async councilMembers(): Promise<(ParsedMember & { memberId: MemberId })[]> {
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

  async voteByProposalAndMember(proposalId: ProposalId, voterId: MemberId): Promise<VoteKind | null> {
    const vote = await this.proposalsEngine.voteExistsByProposalByVoter<VoteKind>(proposalId, voterId);
    const hasVoted = (await this.proposalsEngine.voteExistsByProposalByVoter.size(proposalId, voterId)).toNumber();
    return hasVoted ? vote : null;
  }

  async votes(proposalId: ProposalId): Promise<ProposalVote[]> {
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

  async bestBlock() {
    return await this.api.derive.chain.bestNumber();
  }

  async storageProviders(): Promise<AccountId[]> {
    const providers = (await this.actors.accountIdsByRole(RoleKeys.StorageProvider)) as Vec<AccountId>;
    return providers.toArray();
  }

  async membersExceptCouncil(): Promise<{ id: number, profile: Profile }[]> {
    // Council members to filter out
    const activeCouncil = (await this.council.activeCouncil()) as Seats;
    const membersCount = (await this.members.membersCreated() as MemberId).toNumber();
    let profiles: { id: number, profile: Profile }[] = [];
    for (let id=FIRST_MEMBER_ID.toNumber(); id<membersCount; ++id) {
      const profile = (await this.memberProfile(new MemberId(id))).unwrapOr(null);
      if (
        !profile ||
        // Filter out council members
        activeCouncil.some(seat => (
          seat.member.toString() === profile.controller_account.toString()
          || seat.member.toString() === profile.root_account.toString()
        ))
      ) {
        continue;
      }
      profiles.push({ id, profile });
    }

    return profiles;
  }

  async electionParameters(): Promise<ElectionParameters> {
    const announcing_period = await this.councilElection.announcingPeriod() as BlockNumber;
    const voting_period = await this.councilElection.votingPeriod() as BlockNumber;
    const revealing_period = await this.councilElection.revealingPeriod() as BlockNumber;
    const new_term_duration = await this.councilElection.newTermDuration() as BlockNumber;
    const min_council_stake = await this.councilElection.minCouncilStake() as Balance;
    const min_voting_stake = await this.councilElection.minVotingStake() as Balance;
    const candidacy_limit = await this.councilElection.candidacyLimit() as u32;
    const council_size = await this.councilElection.councilSize() as u32;

    return new ElectionParameters({
      announcing_period,
      voting_period,
      revealing_period,
      new_term_duration,
      min_council_stake,
      min_voting_stake,
      candidacy_limit,
      council_size,
    });
  }

  async WGMintCap(): Promise<number> {
    const WGMintId = await this.contentWorkingGroup.mint() as MintId;
    const WGMint = await this.minting.mints(WGMintId) as Vec<Mint>;
    return (WGMint[0].get('capacity') as u128).toNumber();
  }

  async WGLead(): Promise<{ id: number, profile: Profile } | null> {
    const optLeadId = (await this.contentWorkingGroup.currentLeadId()) as Option<LeadId>;
    const leadId = optLeadId.unwrapOr(null);

    if (!leadId) return null;

    const actorInRole = new ActorInRole({
      role: new Role(RoleKeys.CuratorLead),
      actor_id: leadId
    })
    const memberId = await this.members.membershipIdByActorInRole(actorInRole) as MemberId;
    const profile = (await this.memberProfile(memberId)).unwrapOr(null);

    return profile && { id: memberId.toNumber(), profile };
  }
}
