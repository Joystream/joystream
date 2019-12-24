import { Observable } from 'rxjs';

import { ApiProps } from '@polkadot/react-api/types';
import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces'
import { u128 } from '@polkadot/types'

import { Subscribable } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Role } from '@joystream/types/roles';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"

import { keyPairDetails } from './flows/apply'

import { ActiveRole, OpeningApplication } from "./tabs/MyRoles"

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise

  constructor(apiProps: ApiProps) {
    super()
    this.api = apiProps.api
  }

  async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }

  curationGroup(): Promise<WorkingGroupProps> {
    // Imagine this queried the API!
    // TODO: Make this query the API
    return this.promise<WorkingGroupProps>({} as WorkingGroupProps)
  }

  storageGroup(): Promise<StorageAndDistributionProps> {
    return this.promise<StorageAndDistributionProps>(
      {} as StorageAndDistributionProps,
    )
  }

  currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return this.promise<Array<WorkingGroupOpening>>(
      [],
    )
  }

  opening(id: string): Promise<WorkingGroupOpening> {
    // @ts-ignore
    return this.promise<WorkingGroupOpening>({})
  }

  openingApplicationRanks(openingId: string): Promise<Balance[]> {
    return this.promise<Balance[]>([])
  }

  expectedBlockTime(): Promise<number> {
    return this.promise<number>(
      // @ts-ignore
      this.api.consts.babe.expectedBlockTime.toNumber() / 1000
    )
  }

  transactionFee(): Promise<Balance> {
    return this.promise<Balance>(new u128(5))
  }
  accounts(): Subscribable<keyPairDetails[]> {
    return new Observable<keyPairDetails[]>((observer) => {
    })
  }

  openingApplications(): Subscribable<OpeningApplication[]> {
    return new Observable<OpeningApplication[]>(observer => {
    }
    )
  }

  myCurationGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
    }
    )
  }

  myStorageGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
    }
    )
  }

}
