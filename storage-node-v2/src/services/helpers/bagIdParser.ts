import { BagId, Static } from '@joystream/types/storage'
import { ApiPromise } from '@polkadot/api'

export function parseBagId(api: ApiPromise, bagId: string): BagId {
  const bagIdParts = bagId.toLowerCase().split(':')

  if (bagIdParts.length > 3 || bagIdParts.length < 2) {
    throw new Error(`Invalid bagId: ${bagId}`)
  }

  if (bagIdParts[0] === 'static') {
    return parseStaticBagId(api, bagId, bagIdParts)
  }

  if (bagIdParts[0] === 'dynamic') {
    return parseDynamicBagId()
  }

  throw new Error(`Invalid bagId: ${bagId}`)
}

function parseStaticBagId(
  api: ApiPromise,
  bagId: string,
  bagIdParts: string[]
): BagId {
  if (bagIdParts[1] === 'council') {
    if (bagIdParts.length === 2) {
      const staticBagId: Static = api.createType('Static', 'Council')
      const constructedBagId: BagId = api.createType('BagId', {
        'Static': staticBagId,
      })

      return constructedBagId
    }
  }

  throw new Error(`Invalid bagId: ${bagId}`)
}

function parseDynamicBagId(): BagId {
  throw new Error('Function not implemented.')
}
