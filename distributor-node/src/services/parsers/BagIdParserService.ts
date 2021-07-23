import { BagId } from '@joystream/types/storage'
import { registry } from '@joystream/types'
import { createType } from '@polkadot/types'
import { InterfaceTypes } from '@polkadot/types/types'

export class BagIdParserService {
  private createType<T extends keyof InterfaceTypes>(type: T, value: any) {
    return createType(registry, type, value)
  }

  public parseBagId(bagId: string): BagId {
    const bagIdParts = bagId.toLowerCase().split(':')

    if (bagIdParts.length > 3 || bagIdParts.length < 2) {
      throw new Error(`Invalid bagId: ${bagId}`)
    }

    if (bagIdParts[0] === 'static') {
      return this.parseStaticBagId(bagId, bagIdParts)
    }

    if (bagIdParts[0] === 'dynamic') {
      return this.parseDynamicBagId()
    }

    throw new Error(`Invalid bagId: ${bagId}`)
  }

  public parseStaticBagId(bagId: string, bagIdParts: string[]): BagId {
    if (bagIdParts[1] === 'council') {
      if (bagIdParts.length === 2) {
        const staticBagId = this.createType('StaticBagId', 'Council')
        const constructedBagId = this.createType('BagId', {
          'Static': staticBagId,
        })

        return constructedBagId
      }
    }

    throw new Error(`Invalid bagId: ${bagId}`)
  }

  public parseDynamicBagId(): BagId {
    throw new Error('Function not implemented.')
  }
}
