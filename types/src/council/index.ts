import { Enum, Option } from "@polkadot/types/codec";
import { getTypeRegistry, Struct, Vec } from "@polkadot/types";
import { BlockNumber, AccountId, Balance, Hash } from "@polkadot/types/interfaces";
import { u32 } from "@polkadot/types/primitive";
import { MemberId } from "../members";

export type TransferableStake = {
    seat: Balance;
    backing: Balance;
};

export type Stake = {
    new: Balance;
    transferred: Balance;
};

export class Backer extends Struct {
    constructor(value?: any) {
      super(
        {
          member: "AccountId",
          stake: "Balance"
        },
        value
      );
    }

    get member(): MemberId {
      return this.get("member") as MemberId;
    }

    get stake(): Balance {
      return this.get("stake") as Balance;
    }
}

export class Backers extends Vec.with(Backer) {}
export class Seat extends Struct {
    constructor(value?: any) {
      super(
        {
          member: "AccountId",
          stake: "Balance",
          backers: Backers
        },
        value
      );
    }

    get member(): AccountId {
      return this.get("member") as AccountId;
    }

    get stake(): Balance {
      return this.get("stake") as Balance;
    }

    get backers(): Backers {
      return this.get("backers") as Backers;
    }
}

export class Seats extends Vec.with(Seat) {}

export type SealedVote = {
    voter: AccountId;
    commitment: Hash;
    stake: Stake;
    vote: Option<AccountId>;
};

export class Announcing extends u32 {}
export class Voting extends u32 {}
export class Revealing extends u32 {}

export class ElectionStage extends Enum {
    constructor(value?: any, index?: number) {
        super({
            Announcing,
            Voting,
            Revealing
        }, value, index);
    }

    /** Create a new Announcing stage. */
    static Announcing(endsAt: BlockNumber | number): ElectionStage {
      return this.newElectionStage("Announcing", endsAt);
    }

    /** Create a new Voting stage. */
    static Voting(endsAt: BlockNumber | number): ElectionStage {
      return this.newElectionStage("Voting", endsAt);
    }

    /** Create a new Revealing stage. */
    static Revealing(endsAt: BlockNumber | number): ElectionStage {
      return this.newElectionStage("Revealing", endsAt);
    }

    static newElectionStage(stageName: string, endsAt: BlockNumber | number) {
      return new ElectionStage({ [stageName]: endsAt });
    }
}

export type AnyElectionStage = Announcing | Voting | Revealing;

export type IElectionParameters = {
    announcing_period: BlockNumber;
    voting_period: BlockNumber;
    revealing_period: BlockNumber;
    council_size: u32;
    candidacy_limit: u32;
    new_term_duration: BlockNumber;
    min_council_stake: Balance;
    min_voting_stake: Balance;
};

export class ElectionParameters extends Struct {
    constructor(value?: any) {
      super(
        {
          announcing_period: "BlockNumber",
          voting_period: "BlockNumber",
          revealing_period: "BlockNumber",
          council_size: "u32",
          candidacy_limit: "u32",
          new_term_duration: "BlockNumber",
          min_council_stake: "Balance",
          min_voting_stake: "Balance"
        },
        value
      );
    }
    get announcing_period () {
      return this.get('announcing_period') as BlockNumber;
    }
    get voting_period () {
      return this.get('voting_period') as BlockNumber;
    }
    get revealing_period () {
      return this.get('revealing_period') as BlockNumber;
    }
    get council_size () {
      return this.get('council_size') as u32;
    }
    get candidacy_limit () {
      return this.get('candidacy_limit') as u32;
    }
    get new_term_duration () {
      return this.get('new_term_duration') as BlockNumber;
    }
    get min_council_stake () {
      return this.get('min_council_stake') as Balance;
    }
    get min_voting_stake () {
      return this.get('min_voting_stake') as Balance;
    }
}


// TODO Refactor: split this function and move to corresponding modules: election and proposals.
export function registerCouncilAndElectionTypes() {
    try {
        const typeRegistry = getTypeRegistry();

        typeRegistry.register({
            ElectionStage,
            ElectionStake: {
                new: "Balance",
                transferred: "Balance"
            },
            SealedVote: {
                voter: "AccountId",
                commitment: "Hash",
                stake: "ElectionStake",
                vote: "Option<AccountId>"
            },
            TransferableStake: {
                seat: "Balance",
                backing: "Balance"
            },
            ElectionParameters: {
                announcing_period: "BlockNumber",
                voting_period: "BlockNumber",
                revealing_period: "BlockNumber",
                council_size: "u32",
                candidacy_limit: "u32",
                new_term_duration: "BlockNumber",
                min_council_stake: "Balance",
                min_voting_stake: "Balance"
            },
            Seat,
            Seats,
            Backer,
            Backers,
        });
    } catch (err) {
        console.error("Failed to register custom types for council and election modules", err);
    }
}