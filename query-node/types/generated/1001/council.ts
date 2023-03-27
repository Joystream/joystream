/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { Bytes, Vec, u128, u32, u64 } from "@polkadot/types";
import { AccountId32 } from "@polkadot/types/interfaces";

/**
 * New council was elected
 *
 *  Event parameters: []
 */
export class Council_AnnouncingPeriodStartedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Announcing period can't finish because of insufficient candidtate count
 *
 *  Event parameters: []
 */
export class Council_NotEnoughCandidatesEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Candidates are announced and voting starts
 *
 *  Event parameters: []
 */
export class Council_VotingPeriodStartedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * New candidate announced
 *
 *  Event parameters: []
 */
export class Council_NewCandidateEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, AccountId32, AccountId32, u128] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * New council was elected and appointed
 *
 *  Event parameters: []
 */
export class Council_NewCouncilElectedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [Vec<u64>, u32] {
    return [
      createTypeUnsafe(typeRegistry, "Vec<u64>", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * New council was not elected
 *
 *  Event parameters: []
 */
export class Council_NewCouncilNotElectedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Candidacy stake that was no longer needed was released
 *
 *  Event parameters: []
 */
export class Council_CandidacyStakeReleaseEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64] {
    return [createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Candidate has withdrawn his candidacy
 *
 *  Event parameters: []
 */
export class Council_CandidacyWithdrawEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64] {
    return [createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * The candidate has set a new note for their candidacy
 *
 *  Event parameters: []
 */
export class Council_CandidacyNoteSetEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * The whole reward was paid to the council member.
 *
 *  Event parameters: []
 */
export class Council_RewardPaymentEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, AccountId32, u128, u128] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Budget balance was changed by the root.
 *
 *  Event parameters: []
 */
export class Council_BudgetBalanceSetEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Budget balance was increased by automatic refill.
 *
 *  Event parameters: []
 */
export class Council_BudgetRefillEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * The next budget refill was planned.
 *
 *  Event parameters: []
 */
export class Council_BudgetRefillPlannedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Budget increment has been updated.
 *
 *  Event parameters: []
 */
export class Council_BudgetIncrementUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Councilor reward has been updated.
 *
 *  Event parameters: []
 */
export class Council_CouncilorRewardUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Request has been funded
 *
 *  Event parameters: []
 */
export class Council_RequestFundedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [AccountId32, u128] {
    return [
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}

/**
 * Fund the council budget.
 * Params:
 * - Member ID
 * - Amount of balance
 * - Rationale
 *
 *  Event parameters: []
 */
export class Council_CouncilBudgetFundedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u128, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
  }

  validateParams(): boolean {
    if (this.expectedParamTypes.length !== this.ctx.params.length) {
      return false;
    }
    let valid = true;
    this.expectedParamTypes.forEach((type, i) => {
      if (type !== this.ctx.params[i].type) {
        valid = false;
      }
    });
    return valid;
  }
}
