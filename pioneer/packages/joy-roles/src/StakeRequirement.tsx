import React from 'react';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';

export enum StakeType {
  Fixed = 0,
  AtLeast,
}

export interface IStakeRequirement {
  anyRequirement(): boolean;
  qualifier(): string | null;
  value: Balance;
  fixed(): boolean;
  atLeast(): boolean;
  describe(): any;
}

export abstract class StakeRequirement {
  hard: Balance
  type: StakeType

  constructor (hard: Balance, stakeType: StakeType = StakeType.Fixed) {
    this.hard = hard;
    this.type = stakeType;
  }

  anyRequirement (): boolean {
    return !this.hard.isZero();
  }

  qualifier (): string | null {
    if (this.type == StakeType.AtLeast) {
      return 'at least';
    }
    return null;
  }

  get value (): Balance {
    return this.hard;
  }

  fixed (): boolean {
    return this.type === StakeType.Fixed;
  }

  atLeast (): boolean {
    return this.type === StakeType.AtLeast;
  }
}

export class ApplicationStakeRequirement extends StakeRequirement implements IStakeRequirement {
  describe (): any {
    if (!this.anyRequirement()) {
      return null;
    }

    return (
      <p>
        You must stake {this.qualifier()} <strong>{formatBalance(this.hard)}</strong> to apply for this role. This stake will be returned to you when the hiring process is complete, whether or not you are hired, and will also be used to rank applications.
      </p>
    );
  }
}

export class RoleStakeRequirement extends StakeRequirement implements IStakeRequirement {
  describe (): any {
    if (!this.anyRequirement()) {
      return null;
    }

    return (
      <p>
        You must stake {this.qualifier()} <strong>{formatBalance(this.hard)}</strong> to be eligible for this role. You may lose this stake if you're hired and then dismised from this role. This stake will be returned if your application is unsuccessful, and will also be used to rank applications.
      </p>
    );
  }
}
