/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { BTreeMap, BTreeSet, Bytes, Option, bool, u64 } from "@polkadot/types";
import {
  PalletForumExtendedPostIdObject,
  PalletForumPrivilegedActor,
} from "./types-lookup";

/**
 * A category was introduced
 *
 *  Event parameters: []
 */
export class Forum_CategoryCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Option<u64>, Bytes, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Option<u64>", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[2].value]),
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
 * An arhical status of category with given id was updated.
 * The second argument reflects the new archival status of the category.
 *
 *  Event parameters: []
 */
export class Forum_CategoryArchivalStatusUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, bool, PalletForumPrivilegedActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[2].value,
      ]),
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
 * A category was deleted
 *
 *  Event parameters: []
 */
export class Forum_CategoryDeletedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletForumPrivilegedActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[1].value,
      ]),
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
 * A thread with given id was created.
 * A third argument reflects the initial post id of the thread.
 *
 *  Event parameters: []
 */
export class Forum_ThreadCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, u64, Bytes, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[4].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[5].value]),
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
 * A thread with given id was moderated.
 *
 *  Event parameters: []
 */
export class Forum_ThreadModeratedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Bytes, PalletForumPrivilegedActor, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
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
 * A thread metadata given id was updated.
 *
 *  Event parameters: []
 */
export class Forum_ThreadMetadataUpdatedEvent_V2001 {
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
 * A thread was deleted.
 *
 *  Event parameters: []
 */
export class Forum_ThreadDeletedEvent_V2001 {
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

/**
 * A thread was moved to new category
 *
 *  Event parameters: []
 */
export class Forum_ThreadMovedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, PalletForumPrivilegedActor, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
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
 * Post with given id was created.
 *
 *  Event parameters: []
 */
export class Forum_PostAddedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, u64, Bytes, bool] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[4].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[5].value]),
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
 * Post with givne id was moderated.
 *
 *  Event parameters: []
 */
export class Forum_PostModeratedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Bytes, PalletForumPrivilegedActor, u64, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[4].value]),
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
 * Post with givne id was deleted.
 *
 *  Event parameters: []
 */
export class Forum_PostDeletedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [Bytes, u64, BTreeMap<PalletForumExtendedPostIdObject, bool>] {
    return [
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "BTreeMap<PalletForumExtendedPostIdObject, bool>",
        [this.ctx.params[2].value]
      ),
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
 * Post with given id had its text updated.
 * The second argument reflects the number of total edits when the text update occurs.
 *
 *  Event parameters: []
 */
export class Forum_PostTextUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u64, u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[4].value]),
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
 * Sticky thread updated for category
 *
 *  Event parameters: []
 */
export class Forum_CategoryStickyThreadUpdateEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, BTreeSet<u64>, PalletForumPrivilegedActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "PalletForumPrivilegedActor", [
        this.ctx.params[2].value,
      ]),
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
 * An moderator ability to moderate a category and its subcategories updated
 *
 *  Event parameters: []
 */
export class Forum_CategoryMembershipOfModeratorUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, bool] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[2].value]),
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
