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

import { Enum, Struct } from '@polkadot/types/codec';
import { getTypeRegistry, BlockNumber, AccountId, Balance, u32 } from '@polkadot/types';
import { MemberId } from 'joystream/substrate/types/members';

export class Role extends Enum {
  constructor (value?: any) {
    super([
      'Storage'
    ], value);
  }
}

export class Actor extends Struct {
  constructor (value?: any) {
    super({
      member_id: MemberId,
      role: Role,
      account: AccountId,
      joined_at: BlockNumber
    }, value);
  }

  get member_id (): MemberId {
    return this.get('member_id') as MemberId;
  }

  get role (): Role {
    return this.get('role') as Role;
  }

  get account (): AccountId {
    return this.get('account') as AccountId;
  }
  get joined_at (): BlockNumber {
    return this.get('joined_at') as BlockNumber;
  }
}

export type Request = [AccountId, MemberId, Role, BlockNumber];
export type Requests = Array<Request>;

export class RoleParameters extends Struct {
  constructor (value?: any) {
    super({
      min_stake: Balance,
      min_actors: u32,
      max_actors: u32,
      reward: Balance,
      reward_period: BlockNumber,
      bonding_period: BlockNumber,
      unbonding_period: BlockNumber,
      min_service_period: BlockNumber,
      startup_grace_period: BlockNumber,
      entry_request_fee: Balance
    }, value);
  }

  get min_stake (): Balance {
    return this.get('min_stake') as Balance;
  }
  get max_actors (): u32 {
    return this.get('max_actors') as u32;
  }
  get min_actors (): u32 {
    return this.get('min_actors') as u32;
  }
  get reward (): Balance {
    return this.get('reward') as Balance;
  }
  get reward_period (): BlockNumber {
    return this.get('reward_period') as BlockNumber;
  }
  get unbonding_period (): BlockNumber {
    return this.get('unbonding_period') as BlockNumber;
  }
  get bonding_period (): BlockNumber {
    return this.get('bonding_period') as BlockNumber;
  }
  get min_service_period (): BlockNumber {
    return this.get('min_service_period') as BlockNumber;
  }
  get startup_grace_period (): BlockNumber {
    return this.get('startup_grace_period') as BlockNumber;
  }
  get entry_request_fee (): Balance {
    return this.get('entry_request_fee') as Balance;
  }
}

export function registerRolesTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      Role,
      RoleParameters,
      Request: '(AccountId, MemberId, Role, BlockNumber)',
      Requests: 'Vec<Request>',
      Actor
    });
  } catch (err) {
    console.error('Failed to register custom types of roles module', err);
  }
}
