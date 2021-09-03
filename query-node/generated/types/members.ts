import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@dzlzv/hydra-common";
import { Codec } from "@polkadot/types/types";
import { typeRegistry } from ".";

import { EntryMethod, MemberId, PaidTermId } from "@joystream/types/augment";
import { AccountId, BalanceOf } from "@polkadot/types/interfaces";
import { Bytes, Option } from "@polkadot/types";

export namespace Members {
  export class MemberRegisteredEvent {
    public readonly expectedParamTypes = [
      "MemberId",
      "AccountId",
      "EntryMethod<PaidTermId, AccountId>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberRegistered_Params {
      return new MemberRegistered_Params(this.ctx);
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

  class MemberRegistered_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }

    get accountId(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.ctx.params[1].value
      ]);
    }

    get entryMethod(): EntryMethod {
      return createTypeUnsafe<EntryMethod & Codec>(
        typeRegistry,
        "EntryMethod",
        [this.ctx.params[2].value]
      );
    }
  }
  export class MemberUpdatedAboutTextEvent {
    public readonly expectedParamTypes = ["MemberId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberUpdatedAboutText_Params {
      return new MemberUpdatedAboutText_Params(this.ctx);
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

  class MemberUpdatedAboutText_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }
  }
  export class MemberUpdatedAvatarEvent {
    public readonly expectedParamTypes = ["MemberId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberUpdatedAvatar_Params {
      return new MemberUpdatedAvatar_Params(this.ctx);
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

  class MemberUpdatedAvatar_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }
  }
  export class MemberUpdatedHandleEvent {
    public readonly expectedParamTypes = ["MemberId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberUpdatedHandle_Params {
      return new MemberUpdatedHandle_Params(this.ctx);
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

  class MemberUpdatedHandle_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }
  }
  export class MemberSetRootAccountEvent {
    public readonly expectedParamTypes = ["MemberId", "AccountId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberSetRootAccount_Params {
      return new MemberSetRootAccount_Params(this.ctx);
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

  class MemberSetRootAccount_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }

    get accountId(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class MemberSetControllerAccountEvent {
    public readonly expectedParamTypes = ["MemberId", "AccountId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): MemberSetControllerAccount_Params {
      return new MemberSetControllerAccount_Params(this.ctx);
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

  class MemberSetControllerAccount_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.ctx.params[0].value
      ]);
    }

    get accountId(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.ctx.params[1].value
      ]);
    }
  }

  /**
   *  Non-members can buy membership
   */
  export class BuyMembershipCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "PaidTermId",
      "Option<Bytes>",
      "Option<Bytes>",
      "Option<Bytes>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): BuyMembership_Args {
      return new BuyMembership_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class BuyMembership_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get paidTermsId(): PaidTermId {
      return createTypeUnsafe<PaidTermId & Codec>(typeRegistry, "PaidTermId", [
        this.extrinsic.args[0].value
      ]);
    }

    get handle(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[1].value]
      );
    }

    get avatarUri(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[2].value]
      );
    }

    get about(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[3].value]
      );
    }
  }
  /**
   *  Screened members are awarded a initial locked balance that can only be slashed or used
   *  for fees, and is not transferable. The screening authority must ensure that the provided
   *  new_member_account was verified to avoid applying locks arbitrarily to accounts not controlled
   *  by the member.
   */
  export class AddScreenedMemberCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "AccountId",
      "Option<Bytes>",
      "Option<Bytes>",
      "Option<Bytes>",
      "Option<BalanceOf>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): AddScreenedMember_Args {
      return new AddScreenedMember_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class AddScreenedMember_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get newMemberAccount(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.extrinsic.args[0].value
      ]);
    }

    get handle(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[1].value]
      );
    }

    get avatarUri(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[2].value]
      );
    }

    get about(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[3].value]
      );
    }

    get initialBalance(): Option<BalanceOf> {
      return createTypeUnsafe<Option<BalanceOf> & Codec>(
        typeRegistry,
        "Option<BalanceOf>",
        [this.extrinsic.args[4].value]
      );
    }
  }
  /**
   *  Change member's about text
   */
  export class ChangeMemberAboutTextCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["MemberId", "Bytes"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): ChangeMemberAboutText_Args {
      return new ChangeMemberAboutText_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class ChangeMemberAboutText_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value
      ]);
    }

    get text(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Change member's avatar
   */
  export class ChangeMemberAvatarCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["MemberId", "Bytes"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): ChangeMemberAvatar_Args {
      return new ChangeMemberAvatar_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class ChangeMemberAvatar_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value
      ]);
    }

    get uri(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Change member's handle. Will ensure new handle is unique and old one will be available
   *  for other members to use.
   */
  export class ChangeMemberHandleCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["MemberId", "Bytes"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): ChangeMemberHandle_Args {
      return new ChangeMemberHandle_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class ChangeMemberHandle_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value
      ]);
    }

    get handle(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  export class SetRootAccountCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["MemberId", "AccountId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): SetRootAccount_Args {
      return new SetRootAccount_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class SetRootAccount_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value
      ]);
    }

    get newRootAccount(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  export class SetControllerAccountCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["MemberId", "AccountId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): SetControllerAccount_Args {
      return new SetControllerAccount_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class SetControllerAccount_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value
      ]);
    }

    get newControllerAccount(): AccountId {
      return createTypeUnsafe<AccountId & Codec>(typeRegistry, "AccountId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Update member's all or some of handle, avatar and about text.
   */
  export class UpdateMembershipCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "MemberId",
      "Option<Bytes>",
      "Option<Bytes>",
      "Option<Bytes>",
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateMembership_Args {
      return new UpdateMembership_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class UpdateMembership_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get memberId(): MemberId {
      return createTypeUnsafe<MemberId & Codec>(typeRegistry, "MemberId", [
        this.extrinsic.args[0].value,
      ]);
    }

    get handle(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[1].value]
      );
    }

    get avatarUri(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[2].value]
      );
    }

    get about(): Option<Bytes> {
      return createTypeUnsafe<Option<Bytes> & Codec>(
        typeRegistry,
        "Option<Bytes>",
        [this.extrinsic.args[3].value]
      );
    }
  }
}
