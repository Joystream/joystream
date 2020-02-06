import { Enum, getTypeRegistry, Option, Struct, Null, bool, u32, u64, u128, Text, GenericAccountId, Vec } from '@polkadot/types';
import { BlockNumber, Moment, BalanceOf } from '@polkadot/types/interfaces';
import { OptionText } from './index';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';
import { JoyStruct } from './JoyStruct';

export class MemberId extends u64 {}
export class PaidTermId extends u64 {}
export class SubscriptionId extends u64 {}
export class ActorId extends u64 {}

export class Paid extends PaidTermId {}
export class Screening extends GenericAccountId {}
export class Genesis extends Null {}
export class EntryMethod extends Enum {
  constructor (value?: any, index?: number) {
    super({
      Paid,
      Screening,
      Genesis,
    }, value, index);
  }
}

export class Role extends Enum {
  constructor (value?: any, index?: number) {
    super([
      'StorageProvider',
      'ChannelOwner',
      'CuratorLead',
      'Curator',
    ], value, index);
  }
}

export type IProfile = {
  handle: Text,
  avatar_uri: Text,
  about: Text,
  registered_at_block: BlockNumber,
  registered_at_time: Moment,
  entry: EntryMethod,
  suspended: bool,
  subscription: Option<SubscriptionId>,
  root_account: AccountId,
  controller_account: AccountId,
  roles: Vec<ActorInRole>,
};
export class Profile extends JoyStruct<IProfile> {
  constructor(value?: IProfile) {
    super({
      handle: Text,
      avatar_uri: Text,
      about: Text,
      registered_at_block: u32,
      registered_at_time: u64,
      entry: EntryMethod,
      suspended: bool,
      subscription: Option.with(SubscriptionId),
      root_account: AccountId,
      controller_account: AccountId,
      roles: Vec.with(ActorInRole),
    }, value);
  }

  get handle (): Text {
    return this.get('handle') as Text;
  }

  get avatar_uri (): Text {
    return this.get('avatar_uri') as Text;
  }

  get about (): Text {
    return this.get('about') as Text;
  }

  get registered_at_block (): u32 {
    return this.get('registered_at_block') as u32;
  }

  get registered_at_time (): u64 {
    return this.get('registered_at_time') as u64;
  }

  get entry (): EntryMethod {
    return this.get('entry') as EntryMethod;
  }

  get suspended (): bool {
    return this.get('suspended') as bool;
  }

  get subscription (): Option<SubscriptionId> {
    return this.get('subscription') as Option<SubscriptionId>;
  }

  get root_account (): AccountId {
    return this.get('root_account') as AccountId;
  }

  get controller_account (): AccountId {
    return this.get('controller_account') as AccountId;
  }

  get roles (): Vec<ActorInRole> {
    return this.get('roles') as Vec<ActorInRole>;
  }
}

export class ActorInRole extends Struct {
  constructor (value?: any) {
    super({
      role: Role,
      actor_id: ActorId,
    }, value);
  }
};

export class UserInfo extends Struct {
  constructor (value?: any) {
    super({
      handle: OptionText,
      avatar_uri: OptionText,
      about: OptionText
    }, value);
  }
}

export type CheckedUserInfo = {
  handle: Text,
  avatar_uri: Text,
  about: Text
};

export class PaidMembershipTerms extends Struct {
  constructor (value?: any) {
    super({
      fee: u128, // BalanceOf
      text: Text
    }, value);
  }

  get fee (): BalanceOf {
    return this.get('fee') as BalanceOf;
  }

  get text (): Text {
    return this.get('text') as Text;
  }
}

export function registerMembershipTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      EntryMethod,
      MemberId,
      PaidTermId,
      SubscriptionId,
      Profile: Profile,
      UserInfo,
      CheckedUserInfo: {
        handle: 'Text',
        avatar_uri: 'Text',
        about: 'Text'
      },
      PaidMembershipTerms: {
        fee: 'BalanceOf',
        text: 'Text'
      },
      Role,
      ActorId,
      ActorInRole,
    });
  } catch (err) {
    console.error('Failed to register custom types of membership module', err);
  }
}
