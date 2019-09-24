import { Enum, getTypeRegistry, Option, Struct, bool, u64, u128, Text, GenericAccountId } from '@polkadot/types';
import { BlockNumber, Moment, BalanceOf } from '@polkadot/types/interfaces';
import { OptionText } from './index';

export class MemberId extends u64 {}
export class PaidTermId extends u64 {}
export class SubscriptionId extends u64 {}

export class Paid extends PaidTermId {}
export class Screening extends GenericAccountId {}
export class EntryMethod extends Enum {
  constructor (value?: any, index?: number) {
    super([
      'Paid',
      'Screening'
    ], value, index);
  }
}

export type Profile = {
  id: MemberId,
  handle: Text,
  avatar_uri: Text,
  about: Text,
  registered_at_block: BlockNumber,
  registered_at_time: Moment,
  entry: EntryMethod,
  suspended: bool,
  subscription: Option<SubscriptionId>
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
      id: PaidTermId,
      fee: u128, // BalanceOf
      text: Text
    }, value);
  }

  get id (): PaidTermId {
    return this.get('id') as PaidTermId;
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
    // Register enum EntryMethod and its options:
    typeRegistry.register({
      Paid,
      Screening,
      EntryMethod
    });
    typeRegistry.register({
      MemberId,
      PaidTermId,
      SubscriptionId,
      Profile: {
        id: 'MemberId',
        handle: 'Text',
        avatar_uri: 'Text',
        about: 'Text',
        registered_at_block: 'BlockNumber',
        registered_at_time: 'Moment',
        entry: 'EntryMethod',
        suspended: 'bool',
        subscription: 'Option<SubscriptionId>'
      },
      UserInfo,
      CheckedUserInfo: {
        handle: 'Text',
        avatar_uri: 'Text',
        about: 'Text'
      },
      PaidMembershipTerms: {
        id: 'PaidTermId',
        fee: 'BalanceOf',
        text: 'Text'
      }
    });
  } catch (err) {
    console.error('Failed to register custom types of membership module', err);
  }
}
