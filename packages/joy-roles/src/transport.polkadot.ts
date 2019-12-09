import { ApiProps } from '@polkadot/react-api/types';
import ApiPromise from '@polkadot/api/promise';

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Role } from '@joystream/types/roles';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise

  constructor(apiProps: ApiProps) {
    super()
    this.api = apiProps.api
  }

  public async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }

  public curationGroup(): Promise<WorkingGroupProps> {
    // Imagine this queried the API!
    // TODO: Make this query the API
    return this.promise<WorkingGroupProps>({} as WorkingGroupProps)
  }

  public storageGroup(): Promise<StorageAndDistributionProps> {
    return this.promise<StorageAndDistributionProps>(
      {} as StorageAndDistributionProps,
    )
  }

  public currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return this.promise<Array<WorkingGroupOpening>>(
      [],
    )
  }

  public expectedBlockTime(): Promise<number> {
    return this.promise<number>(
	  // @ts-ignore
      this.api.consts.babe.expectedBlockTime.toNumber() / 1000
    )
  }
}
