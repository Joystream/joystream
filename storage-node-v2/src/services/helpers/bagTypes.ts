import { BagId, DynamicBagType, DynamicBagTypeKey, Static, Dynamic } from '@joystream/types/storage'
import { WorkingGroup } from '@joystream/types/common'
import { registry } from '@joystream/types'
import { createType } from '@polkadot/types'
import { DetectCodec, Codec } from '@polkadot/types/types'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'

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
export function parseDynamicBagType(bagType: DynamicBagTypeKey): DynamicBagType {
  return createJoystreamType('DynamicBagType', bagType)
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
        const staticBagId: Static = createJoystreamType('Static', 'Council')
        const constructedBagId: BagId = createJoystreamType('BagId', {
          'Static': staticBagId,
        })

        return constructedBagId
      }
    }

    // Try to construct static working group bag ID.
    if (this.bagIdParts[1] === 'wg') {
      if (this.bagIdParts.length === 3) {
        const groups = Object.keys(WorkingGroup.typeDefinitions)
        const actualGroup = this.bagIdParts[2]

        for (const group of groups) {
          if (group.toLowerCase() === actualGroup) {
            const workingGroup: WorkingGroup = createJoystreamType('WorkingGroup', group)
            const staticBagId: Static = createJoystreamType('Static', {
              'WorkingGroup': workingGroup,
            })
            const constructedBagId: BagId = createJoystreamType('BagId', {
              'Static': staticBagId,
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
        const dynamicBagTypes = Object.keys(DynamicBagType.typeDefinitions)
        const actualType = this.bagIdParts[1]

        // Try to construct dynamic bag ID.
        for (const dynamicBagType of dynamicBagTypes) {
          if (dynamicBagType.toLowerCase() === actualType) {
            const dynamic = {} as Record<DynamicBagTypeKey, number>
            dynamic[dynamicBagType as DynamicBagTypeKey] = parsedId

            const dynamicBagId: Dynamic = createJoystreamType('Dynamic', dynamic)
            const constructedBagId: BagId = createJoystreamType('BagId', {
              'Dynamic': dynamicBagId,
            })

            return constructedBagId
          }
        }
      }
    }

    throw new BagIdValidationError(`Invalid dynamic bagId: ${this.bagId}`)
  }
}

/**
 * Creates Joystream type using type registry.
 */
function createJoystreamType<T extends Codec = Codec, K extends string = string>(
  type: K,
  value: unknown
): DetectCodec<T, K> {
  return createType(registry, type, value)
}
