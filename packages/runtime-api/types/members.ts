/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { EnumType, Option, Struct } from '@polkadot/types/codec';
import { getTypeRegistry, Bool, BlockNumber, Moment, AccountId, BalanceOf, u64, Text } from '@polkadot/types';
import { OptionText } from '@joystream/runtime-api/types/utils';

export class MemberId extends u64 {}
export class PaidTermId extends u64 {}
export class SubscriptionId extends u64 {}

export class Paid extends PaidTermId {}
export class Screening extends AccountId {}
export class EntryMethod extends EnumType<Paid | Screening> {
  constructor (value?: any, index?: number) {
    super({
      Paid,
      Screening
    }, value, index);
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
  suspended: Bool,
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
      fee: BalanceOf,
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
        suspended: 'Bool',
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
