import {
  PalletStorageBagIdType as BagId,
  PalletStorageDynamicBagType as DynamicBagType,
  PalletStorageStaticBagId as Static,
  PalletCommonWorkingGroupIterableEnumsWorkingGroup,
} from '@polkadot/types/lookup'
import { createType, keysOf } from '@joystream/types'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'
import { hexToBigInt } from '@polkadot/util'

/**
 * Special error type for bagId parsing. Extends the CLIError with setting
 * the `InvalidParameters` exit code.
 */
export class BagIdValidationError extends CLIError {
  constructor(err: string) {
    super(err, {
      exit: ExitCodes.InvalidParameters,
    })
  }
}

/**
 * Parses the type string and returns the DynamicBagType instance.
 *
 * @remarks
 * This method uses runtime API for type construction.
 *
 * @param api - runtime API promise
 * @param bagType - dynamic bag type string
 * @returns The DynamicBagType instance.
 */
export function parseDynamicBagType(bagType: DynamicBagType['type']): DynamicBagType {
  return createType('PalletStorageDynamicBagType', bagType)
}

/**
 * Parses the type string and returns the BagId instance.
 *
 * @remarks
 * This method uses runtime API for type construction. It throws an exception
 * on invalid string format.
 *
 * @param api - runtime API promise
 * @param bagId - bag ID in string format
 * @returns The BagId instance.
 */
export function parseBagId(bagId: string): BagId {
  const parser = new BagIdParser(bagId)

  return parser.parse()
}

/**
 * Converts a BagId Codec type to string
 * (compatible with Storage Squid / Orion / Query Node bag id)
 *
 * @param bagId Bag id as Codec type
 * @returns Bag id as string
 */
export function stringifyBagId(bagId: BagId): string {
  if (bagId.isDynamic) {
    return bagId.asDynamic.isChannel
      ? `dynamic:channel:${bagId.asDynamic.asChannel.toString()}`
      : `dynamic:member:${bagId.asDynamic.asMember.toString()}`
  }

  return bagId.asStatic.isCouncil ? `static:council` : `static:wg:${bagId.asStatic.asWorkingGroup.type.toLowerCase()}`
}

/**
 * Compares two bag ids by converting them to a BigInt
 * (useful for sorting)
 *
 * @param idA First bag id
 * @param idB Second bag id
 * @returns -1 if idA < idB, 0 if idA == idB, 1 if idA > idA
 */
export function cmpBagIds(idA: BagId, idB: BagId): number {
  const diff = hexToBigInt(idA.toHex()) - hexToBigInt(idB.toHex())
  return diff < 0 ? -1 : diff > 0 ? 1 : 0
}

/**
 * Class-helper for actual bag ID parsing.
 */
class BagIdParser {
  bagId: string
  bagIdParts: string[]

  constructor(bagId: string) {
    this.bagId = bagId

    this.bagIdParts = bagId.trim().toLowerCase().split(':')

    if (this.bagIdParts.length > 3 || this.bagIdParts.length < 2) {
      throw new BagIdValidationError(`Invalid bagId: ${bagId}`)
    }
  }

  /**
   * Tries to parse the bag ID using given bag ID in string format, throws an
   * exception on failure.
   */
  parse(): BagId {
    if (this.bagIdParts[0] === 'static') {
      return this.parseStaticBagId()
    }

    if (this.bagIdParts[0] === 'dynamic') {
      return this.parseDynamicBagId()
    }

    throw new BagIdValidationError(`Invalid bagId: ${this.bagId}`)
  }

  /**
   * Tries to parse the static bag ID, throws an exception on failure.
   */
  parseStaticBagId(): BagId {
    // Try to construct static council bag ID.
    if (this.bagIdParts[1] === 'council') {
      if (this.bagIdParts.length === 2) {
        const staticBagId = createType('PalletStorageStaticBagId', 'Council')
        const constructedBagId: BagId = createType('PalletStorageBagIdType', {
          'Static': staticBagId,
        })

        return constructedBagId
      }
    }

    // Try to construct static working group bag ID.
    if (this.bagIdParts[1] === 'wg') {
      if (this.bagIdParts.length === 3) {
        const groups = keysOf<
          PalletCommonWorkingGroupIterableEnumsWorkingGroup,
          'PalletCommonWorkingGroupIterableEnumsWorkingGroup'
        >('PalletCommonWorkingGroupIterableEnumsWorkingGroup')
        const actualGroup = this.bagIdParts[2]

        for (const group of groups) {
          if (group.toLowerCase() === actualGroup) {
            const workingGroup = createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', group)
            const staticBagId: Static = createType('PalletStorageStaticBagId', {
              'WorkingGroup': workingGroup,
            })
            const constructedBagId: BagId = createType('PalletStorageBagIdType', {
              Static: staticBagId,
            })

            return constructedBagId
          }
        }
      }
    }

    throw new BagIdValidationError(`Invalid static bagId: ${this.bagId}`)
  }

  /**
   * Tries to parse the dynamic bag ID, throws an exception on failure.
   */
  parseDynamicBagId(): BagId {
    if (this.bagIdParts.length === 3) {
      const idString = this.bagIdParts[2]
      const parsedId = parseInt(idString)

      // Verify successful entity ID parsing
      if (!isNaN(parsedId)) {
        const dynamicBagTypes = keysOf<DynamicBagType, 'PalletStorageDynamicBagType'>('PalletStorageDynamicBagType')
        const actualType = this.bagIdParts[1]

        // Try to construct dynamic bag ID.
        for (const dynamicBagType of dynamicBagTypes) {
          if (dynamicBagType.toLowerCase() === actualType) {
            const dynamic = {} as Record<DynamicBagType['type'], number>
            dynamic[dynamicBagType as DynamicBagType['type']] = parsedId

            const dynamicBagId = createType('PalletStorageDynamicBagIdType', dynamic)
            const constructedBagId: BagId = createType('PalletStorageBagIdType', {
              Dynamic: dynamicBagId,
            })

            return constructedBagId
          }
        }
      }
    }

    throw new BagIdValidationError(`Invalid dynamic bagId: ${this.bagId}`)
  }
}
