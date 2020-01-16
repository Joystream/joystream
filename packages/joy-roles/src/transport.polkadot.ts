import { Observable } from 'rxjs';

import ApiPromise from '@polkadot/api/promise';
import { Balance } from '@polkadot/types/interfaces'
import { u32, u128 } from '@polkadot/types'

import { Subscribable, LinkedMapEntry } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Role } from '@joystream/types/roles';
import { OpeningId } from '@joystream/types/hiring';
import { CuratorOpening, LeadId } from '@joystream/types/content-working-group';
import { Opening } from '@joystream/types/hiring';

import { WorkingGroupMembership, StorageAndDistributionMembership } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"

import { keyPairDetails } from './flows/apply'

import { ActiveRole, OpeningApplication } from "./tabs/MyRoles"

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise

  constructor(api: ApiPromise) {
    super()
    this.api = api
  }

  async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }

  curationGroup(): Promise<WorkingGroupMembership> {
    // Imagine this queried the API!
    // TODO: Make this query the API
    return this.promise<WorkingGroupMembership>({} as WorkingGroupMembership)
  }

  storageGroup(): Promise<StorageAndDistributionMembership> {
    return this.promise<StorageAndDistributionMembership>(
      {} as StorageAndDistributionMembership,
    )
  }

  currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return this.promise<Array<WorkingGroupOpening>>(
      [],
    )
  }

  protected async opening(id: number): Promise<Opening> {
    return new Promise<Opening>( async (resolve, reject) => {
       const opening = new LinkedMapEntry<Opening>(
        Opening, 
        await this.api.query.hiring.openingById(id),
      )
      resolve(opening.value)
    })
  }

  async curationGroupOpening(id: number): Promise<WorkingGroupOpening> {
    return new Promise<WorkingGroupOpening>( async (resolve, reject) => {
      const nextId = (await this.api.query.contentWorkingGroup.nextCuratorOpeningId() as u32).toNumber()
      if (id < 0 || id >= nextId) {
        reject("invalid id")
      }

      const curatorOpening = new LinkedMapEntry<CuratorOpening>(
        CuratorOpening, 
        await this.api.query.contentWorkingGroup.curatorOpeningById(id),
      )

      const opening = await this.opening(
          curatorOpening.value.getField<OpeningId>("opening_id").toNumber()
      )

      console.log("opening", opening.toJSON())
      console.log("curatorO", curatorOpening.value.toJSON())

      // TODO: Load group lead
      const currentLeadId = await this.api.query.contentWorkingGroup.currentLeadId() as LeadId
      console.log(currentLeadId)

      reject("WIP")

      // @ts-ignore
      resolve({
        creator: {},
        opening: opening,
        applications: {},
      })
    })
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
