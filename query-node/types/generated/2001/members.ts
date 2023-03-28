/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { Bytes, Option, bool, u128, u32, u64, u8 } from "@polkadot/types";
import {
  PalletMembershipBuyMembershipParameters,
  PalletMembershipCreateMemberParameters,
  PalletMembershipGiftMembershipParameters,
  PalletMembershipInviteMembershipParameters,
} from "./types-lookup";
import { AccountId32 } from "@polkadot/types/interfaces";
import { Codec } from "@polkadot/types/types";

export class Members_MembershipBoughtEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletMembershipBuyMembershipParameters, u32] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletMembershipBuyMembershipParameters",
        [this.ctx.params[1].value]
      ),
      createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[2].value]),
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

export class Members_MembershipGiftedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletMembershipGiftMembershipParameters] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletMembershipGiftMembershipParameters",
        [this.ctx.params[1].value]
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

export class Members_MemberCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletMembershipCreateMemberParameters, u32] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletMembershipCreateMemberParameters", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[2].value]),
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

export class Members_MemberProfileUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Option<Bytes>, Option<Bytes>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Option<Bytes>", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "Option<Bytes>", [
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

export class Members_MemberAccountsUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Option<AccountId32>, Option<AccountId32>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Option<AccountId32>", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "Option<AccountId32>", [
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

export class Members_MemberVerificationStatusUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, bool, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[1].value]),
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

export class Members_InvitesTransferredEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u32] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[2].value]),
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

export class Members_MemberInvitedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletMembershipInviteMembershipParameters, u128] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletMembershipInviteMembershipParameters",
        [this.ctx.params[1].value]
      ),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
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

export class Members_StakingAccountAddedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [AccountId32, u64] {
    return [
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[0].value]),
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

export class Members_StakingAccountConfirmedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [AccountId32, u64] {
    return [
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[0].value]),
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

export class Members_StakingAccountRemovedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [AccountId32, u64] {
    return [
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[0].value]),
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

export class Members_InitialInvitationCountUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
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

export class Members_MembershipPriceUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
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

export class Members_ReferralCutUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u8] {
    return [createTypeUnsafe(typeRegistry, "u8", [this.ctx.params[0].value])];
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

export class Members_InitialInvitationBalanceUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128] {
    return [createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value])];
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

export class Members_LeaderInvitationQuotaUpdatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u32] {
    return [createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value])];
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

export class Members_MemberRemarkedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Bytes, Option<[AccountId32, u128] & Codec>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Option<(AccountId32,u128)>", [
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
