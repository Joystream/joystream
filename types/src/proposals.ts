import { Text, u32, Enum, getTypeRegistry, Tuple, GenericAccountId, u8, Vec, Option, Struct, Null, Bytes } from "@polkadot/types";
import { BlockNumber, Balance } from "@polkadot/types/interfaces";
import AccountId from "@polkadot/types/primitive/Generic/AccountId";
import { ThreadId, JoyStruct } from "./common";
import { MemberId } from "./members";
import { RoleParameters } from "./roles";
import { StakeId } from "./stake";
import { ElectionParameters } from "./council";

export type IVotingResults = {
  abstensions: u32;
  approvals: u32;
  rejections: u32;
  slashes: u32;
};

export class VotingResults extends Struct {
  constructor(value?: any) {
    super(
      {
        abstensions: "u32",
        approvals: "u32",
        rejections: "u32",
        slashes: "u32"
      },
      value
    );
  }
}

export type ProposalParametersType = {
  // During this period, votes can be accepted
  votingPeriod: BlockNumber;

  /* A pause before execution of the approved proposal. Zero means approved proposal would be
     executed immediately. */
  gracePeriod: BlockNumber;

  // Quorum percentage of approving voters required to pass the proposal.
  approvalQuorumPercentage: u32;

  // Approval votes percentage threshold to pass the proposal.
  approvalThresholdPercentage: u32;

  // Quorum percentage of voters required to slash the proposal.
  slashingQuorumPercentage: u32;

  // Slashing votes percentage threshold to slash the proposal.
  slashingThresholdPercentage: u32;

  // Proposal stake
  requiredStake: Balance;
};

class ProposalParameters extends Struct {
  constructor(value?: any) {
    super(
      {
        // During this period, votes can be accepted
        votingPeriod: "BlockNumber",

        /* A pause before execution of the approved proposal. Zero means approved proposal would be
     executed immediately. */
        gracePeriod: "BlockNumber",

        // Quorum percentage of approving voters required to pass the proposal.
        approvalQuorumPercentage: "u32",

        // Approval votes percentage threshold to pass the proposal.
        approvalThresholdPercentage: "u32",

        // Quorum percentage of voters required to slash the proposal.
        slashingQuorumPercentage: "u32",

        // Slashing votes percentage threshold to slash the proposal.
        slashingThresholdPercentage: "u32",

        // Proposal stake
        requiredStake: "Option<Balance>"
      },
      value
    );
  }

  // During this period, votes can be accepted
  get votingPeriod(): BlockNumber {
    return this.get("votingPeriod") as BlockNumber;
  }

  /* A pause before execution of the approved proposal. Zero means approved proposal would be
     executed immediately. */
  get gracePeriod(): BlockNumber {
    return this.get("gracePeriod") as BlockNumber;
  }

  // Quorum percentage of approving voters required to pass the proposal.
  get approvalQuorumPercentage(): u32 {
    return this.get("approvalQuorumPercentage") as u32;
  }

  // Approval votes percentage threshold to pass the proposal.
  get approvalThresholdPercentage(): u32 {
    return this.get("approvalThresholdPercentage") as u32;
  }

  // Quorum percentage of voters required to slash the proposal.
  get slashingQuorumPercentage(): u32 {
    return this.get("slashingQuorumPercentage") as u32;
  }

  // Slashing votes percentage threshold to slash the proposal.
  get slashingThresholdPercentage(): u32 {
    return this.get("slashingThresholdPercentage") as u32;
  }

  // Proposal stake
  get requiredStake(): Option<Balance> {
    return this.get("requiredStake") as Option<Balance>;
  }
}

export type IProposal = {
  parameters: ProposalParameters;
  proposerId: MemberId;
  title: Text;
  description: Text;
  createdAt: BlockNumber;
  status: ProposalStatus;
  votingResults: VotingResults;
};

export const IProposalStatus: { [key: string]: string } = {
  Active: "Active",
  Canceled: "Canceled",
  Expired: "Expired",
  Approved: "Approved",
  Rejected: "Rejected",
  Vetoed: "Vetoed",
  PendingExecution: "PendingExecution",
  Executed: "Executed",
  ExecutionFailed: "ExecutionFailed",
  Finalized: "Finalized",
  Slashed: "Slashed"
};

export type IActiveStake = {
  stake_id: StakeId;
  source_account_id: AccountId;
};
export class ActiveStake extends JoyStruct<IActiveStake> {
  constructor(value?: IActiveStake) {
    super(
      {
        stakeId: StakeId,
        sourceAccountId: GenericAccountId
      },
      value
    );
  }
}

export class ExecutionFailedStatus extends Struct {
  constructor(value?: any) {
    super(
      {
        error: "Vec<u8>",
      },
      value
    );
  }

  get error() {
    return this.get('error') as Vec<u8>;
  }
}

class ExecutionFailed extends ExecutionFailedStatus {}

export type ApprovedProposalStatuses = "PendingExecution" | "Executed" | "ExecutionFailed";

export class ApprovedProposalStatus extends Enum {
  constructor(value?: any, index?: number) {
    super({
      PendingExecution: Null,
      Executed: Null,
      ExecutionFailed
    }, value, index);
  }
}
export class Approved extends ApprovedProposalStatus {};

export type ProposalDecisionStatuses = "Canceled" | "Vetoed" | "Rejected" | "Slashed" | "Expired" | "Approved";

export class ProposalDecisionStatus extends Enum {
  constructor(value?: any, index?: number) {
    super({
      Canceled: Null,
      Vetoed: Null,
      Rejected: Null,
      Slashed: Null,
      Expired: Null,
      Approved
    }, value, index);
  }
}

export type IFinalizationData = {
  proposalStatus: ProposalDecisionStatus;
  finalizedAt: BlockNumber;
  encodedUnstakingErrorDueToBrokenRuntime: Option<Vec<u8>>;
  stakeDataAfterUnstakingError: Option<ActiveStake>;
};

export class FinalizationData extends JoyStruct<IFinalizationData> {
  constructor(value?: IFinalizationData) {
    super(
      {
        proposalStatus: ProposalDecisionStatus,
        finalizedAt: u32,
        encodedUnstakingErrorDueToBrokenRuntime: Option.with(Vec.with(u8)),
        stakeDataAfterUnstakingError: Option.with(ActiveStake)
      },
      value
    );
  }
}

export class Active extends Option.with(ActiveStake) {}
export class Finalized extends FinalizationData {}

export class ProposalStatus extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        Active,
        Finalized
      },
      value,
      index
    );
  }
}

export const VoteKinds = [
  "Approve",
  "Reject",
  "Slash",
  "Abstain"
] as const;

export class VoteKind extends Enum {
  constructor(value?: any, index?: number) {
    super(["Approve", "Reject", "Slash", "Abstain"], value, index);
  }
}

export type ProposalVotes = [MemberId, VoteKind][];

export class ProposalId extends u32 {}

export class SpendingParams extends Tuple {
  constructor(value?: any) {
    super(["Balance", "AccountId"], value);
  }
}

class SetLeadParams extends Tuple {
  constructor(value?: any) {
    super([MemberId, AccountId], value);
  }
}

export class SetLead extends Option.with(SetLeadParams) {}

export class ProposalDetails extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        Text: "Text",
        RuntimeUpgrade: "Vec<u8>",
        SetElectionParameters: ElectionParameters,
        Spending: SpendingParams,
        SetLead: SetLead,
        SetContentWorkingGroupMintCapacity: "Balance",
        EvictStorageProvider: "AccountId",
        SetValidatorCount: "u32",
        SetStorageRoleParameters: RoleParameters
      },
      value,
      index
    );
  }
}

export class Proposal extends Struct {
  constructor(value?: any) {
    super(
      {
        // Proposals parameter, characterize different proposal types.
        parameters: ProposalParameters,

        // Identifier of member proposing.
        proposerId: MemberId,

        // Proposal description
        title: Text,

        // Proposal body
        description: Text,

        // When it was created.
        createdAt: "BlockNumber",

        /// Current proposal status
        status: ProposalStatus,

        /// Curring voting result for the proposal
        votingResults: VotingResults
      },
      value
    );
  }

  get parameters(): ProposalParameters {
    return this.get("parameters") as ProposalParameters;
  }

  get proposerId(): MemberId {
    return this.get("proposerId") as MemberId;
  }

  get title(): Text {
    return this.get("description") as Text;
  }

  get description(): Text {
    return this.get("description") as Text;
  }

  get createdAt(): BlockNumber {
    return this.get("createdAt") as BlockNumber;
  }

  get status(): ProposalStatus {
    return this.get("status") as ProposalStatus;
  }

  get votingResults(): VotingResults {
    return this.get("votingResults") as VotingResults;
  }
}

export class ThreadCounter extends Struct {
  constructor(value?: any) {
    super(
      {
        author_id: MemberId,
        counter: "u32"
      },
      value
    );
  }

  get author_id(): MemberId {
    return this.get("author_id") as MemberId;
  }

  get counter(): u32 {
    return this.get("counter") as u32;
  }
}

export class DiscussionThread extends Struct {
  constructor(value?: any) {
    super(
    {
      title: Bytes,
      'created_at': "BlockNumber",
      'author_id': MemberId
    },
    value
    );
  }

  get title(): Bytes {
	  return this.get('title') as Bytes;
  }

  get created_at(): BlockNumber {
	  return this.get('created_ad') as BlockNumber;
  }

  get author_id(): MemberId {
	  return this.get('author_id') as MemberId;
  }
}

export class DiscussionPost extends Struct {
  constructor(value?: any) {
    super(
      {
        text: Bytes,
        /// When post was added.
        created_at: "BlockNumber",
        /// When post was updated last time.
        updated_at: "BlockNumber",
        /// Author of the post.
        author_id: MemberId,
        /// Parent thread id for this post
        thread_id: ThreadId,
        /// Defines how many times this post was edited. Zero on creation.
        edition_number: u32,
      },
      value
    );
  }

  get text(): Bytes {
    return this.get('text') as Bytes;
  }

  get created_at(): BlockNumber {
    return this.get('created_at') as BlockNumber;
  }

  get updated_at(): BlockNumber {
    return this.get('updated_at') as BlockNumber;
  }

  get author_id(): MemberId {
    return this.get('author_id') as MemberId;
  }

  get thread_id(): ThreadId {
    return this.get('thread_id') as ThreadId;
  }

  get edition_number(): u32 {
    return this.get('edition_number') as u32;
  }
}

// export default proposalTypes;
export function registerProposalTypes() {
  try {
    getTypeRegistry().register({
      ProposalId,
      ProposalStatus,
      ProposalOf: Proposal,
      ProposalDetails,
      VotingResults,
      ProposalParameters,
      VoteKind,
      ThreadCounter,
      DiscussionThread,
      DiscussionPost
    });
  } catch (err) {
    console.error("Failed to register custom types of proposals module", err);
  }
}
