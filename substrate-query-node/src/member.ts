/**
 * This module contains corresponding classes for Joystream member module
 */

export class BaseMemberEvent {
  private _memberId: number;

  public set memberId(v: any) {
    this._memberId = +v;
  }

  public get memberId() {
    return this._memberId;
  }
}

export class BaseMemberAccountEvent extends BaseMemberEvent {
  private _accountId: string;

  public set accountId(v: any) {
    this._accountId = v.toString();
  }

  public get accountId() {
    return this._accountId;
  }
}

export class BaseMemberRoleEvent extends BaseMemberEvent {
  private _actorId: string;

  public set actorId(v: any) {
    this._actorId = v.toString();
  }

  public get actorId() {
    return this._actorId;
  }
}

export class MemberRegisteredEvent extends BaseMemberAccountEvent {}
export class MemberSetRootAccountEvent extends BaseMemberAccountEvent {}
export class MemberSetControllerAccountEvent extends BaseMemberAccountEvent {}

export class MemberUpdatedAboutTextEvent extends BaseMemberEvent {}
export class MemberUpdatedAvatarEvent extends BaseMemberEvent {}
export class MemberUpdatedHandleEvent extends BaseMemberEvent {}

export class MemberRegisteredRoleEvent extends BaseMemberEvent {}
export class MemberUnregisteredRoleEvent extends BaseMemberEvent {}
