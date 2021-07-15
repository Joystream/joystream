import {
  BagId,
  DynamicBagType,
  DynamicBagTypeKey,
  Static,
  Dynamic,
} from '@joystream/types/storage'
import { WorkingGroup } from '@joystream/types/common'
import { ApiPromise } from '@polkadot/api'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'

export function parseDynamicBagType(
  api: ApiPromise,
  bagType: DynamicBagTypeKey
): DynamicBagType {
  return api.createType('DynamicBagType', bagType)
}

export function parseBagId(api: ApiPromise, bagId: string): BagId {
  const parser = new BagIdParser(api, bagId)

  return parser.parse()
}

class BagIdParser {
  bagId: string
  api: ApiPromise
  bagIdParts: string[]

  constructor(api: ApiPromise, bagId: string) {
    this.bagId = bagId
    this.api = api

    this.bagIdParts = bagId.trim().toLowerCase().split(':')

    if (this.bagIdParts.length > 3 || this.bagIdParts.length < 2) {
      throw new CLIError(`Invalid bagId: ${bagId}`, {
        exit: ExitCodes.InvalidParameters,
      })
    }
  }

  parse(): BagId {
    if (this.bagIdParts[0] === 'static') {
      return this.parseStaticBagId()
    }

    if (this.bagIdParts[0] === 'dynamic') {
      return this.parseDynamicBagId()
    }

    throw new CLIError(`Invalid bagId: ${this.bagId}`, {
      exit: ExitCodes.InvalidParameters,
    })
  }

  parseStaticBagId(): BagId {
    // Try to construct static council bag ID.
    if (this.bagIdParts[1] === 'council') {
      if (this.bagIdParts.length === 2) {
        const staticBagId: Static = this.api.createType('Static', 'Council')
        const constructedBagId: BagId = this.api.createType('BagId', {
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
            const workingGroup: WorkingGroup = this.api.createType(
              'WorkingGroup',
              group
            )
            const staticBagId: Static = this.api.createType('Static', {
              'WorkingGroup': workingGroup,
            })
            const constructedBagId: BagId = this.api.createType('BagId', {
              'Static': staticBagId,
            })

            return constructedBagId
          }
        }
      }
    }

    throw new CLIError(`Invalid static bagId: ${this.bagId}`, {
      exit: ExitCodes.InvalidParameters,
    })
  }

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
            const dynamic = {}
            dynamic[dynamicBagType] = parsedId

            const dynamicBagId: Dynamic = this.api.createType(
              'Dynamic',
              dynamic
            )
            const constructedBagId: BagId = this.api.createType('BagId', {
              'Dynamic': dynamicBagId,
            })

            return constructedBagId
          }
        }
      }
    }

    throw new CLIError(`Invalid dynamic bagId: ${this.bagId}`, {
      exit: ExitCodes.InvalidParameters,
    })
  }
}
