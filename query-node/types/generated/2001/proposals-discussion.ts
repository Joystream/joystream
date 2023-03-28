/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { Bytes, bool, u64 } from "@polkadot/types";
import { PalletProposalsDiscussionThreadModeBTreeSet } from "./types-lookup";

/**
 * Emits on thread creation.
 *
 *  Event parameters: []
 */
export class ProposalsDiscussion_ThreadCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
 * Emits on post creation.
 *
 *  Event parameters: []
 */
export class ProposalsDiscussion_PostCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, Bytes, bool] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[4].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
 * Emits on post update.
 *
 *  Event parameters: []
 */
export class ProposalsDiscussion_PostUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
 * Emits on thread mode change.
 *
 *  Event parameters: []
 */
export class ProposalsDiscussion_ThreadModeChangedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletProposalsDiscussionThreadModeBTreeSet, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletProposalsDiscussionThreadModeBTreeSet",
        [this.ctx.params[1].value]
      ),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
 * Emits on post deleted
 *
 *  Event parameters: []
 */
export class ProposalsDiscussion_PostDeletedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, bool] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
