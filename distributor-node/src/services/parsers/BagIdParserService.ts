import { BagId, StaticBagId } from '@joystream/types/storage'
import { createType } from '@joystream/types'
import { WorkingGroup, WorkingGroupKey } from '@joystream/types/common'

export class BagIdParserService {
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
    // Try to construct static council bag ID.
    if (bagIdParts[1] === 'council') {
      if (bagIdParts.length === 2) {
        const staticBagId = createType<StaticBagId, 'StaticBagId'>('StaticBagId', 'Council')
        const constructedBagId = createType<BagId, 'BagId'>('BagId', {
          'Static': staticBagId,
        })

        return constructedBagId
      }
    }

    // Try to construct static working group bag ID.
    if (bagIdParts[1] === 'wg' && bagIdParts.length === 3) {
      const groups = Object.keys(WorkingGroup.typeDefinitions) as WorkingGroupKey[]
      const inputGroup = bagIdParts[2]

      if (groups.find((g) => g.toLocaleLowerCase() === inputGroup)) {
        return createType<BagId, 'BagId'>('BagId', {
          Static: {
            WorkingGroup: inputGroup as WorkingGroupKey,
          },
        })
      }
    }

    throw new Error(`Invalid bagId: ${bagId}`)
  }

  public parseDynamicBagId(): BagId {
    throw new Error('Function not implemented.')
  }
}
