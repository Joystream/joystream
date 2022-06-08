import { BagId, DynamicBagTypeKey } from '@joystream/types/storage'
import { createType } from '@joystream/types'
import { WorkingGroup, WorkingGroupKey } from '@joystream/types/common'
import { CLIError } from '@oclif/errors'
import ExitCodes from '../../command-base/ExitCodes'

export class BagIdParserService {
  private bagId: string
  private bagIdParts: [string, string, string?]

  public constructor(bagId: string) {
    this.bagId = bagId
    const bagIdParts = bagId.toLowerCase().split(':')

    if (bagIdParts.length > 3 || bagIdParts.length < 2) {
      this.invalidBagId()
    }

    const [bagType, bagSubtype, bagOptIdentifier] = bagIdParts
    this.bagIdParts = [bagType, bagSubtype, bagOptIdentifier]
  }

  private invalidBagId(reason?: string): never {
    throw new CLIError(`Invalid bagId: ${this.bagId}. ${reason}`, {
      exit: ExitCodes.InvalidInput,
    })
  }

  public parse(): BagId {
    const [bagType] = this.bagIdParts
    if (bagType === 'static') {
      return this.parseStaticBagId()
    }

    if (bagType === 'dynamic') {
      return this.parseDynamicBagId()
    }

    this.invalidBagId(`Unrecognized bag type: ${bagType}.`)
  }

  private parseStaticBagId(): BagId {
    const [, staticBagType, optGroupName] = this.bagIdParts
    // Try to construct static council bag ID.
    if (staticBagType === 'council') {
      if (optGroupName === undefined) {
        return createType<BagId, 'BagId'>('BagId', {
          'Static': 'Council',
        })
      }

      this.invalidBagId(`Unexpected identifier after "static:council": ${optGroupName}.`)
    }

    // Try to construct static working group bag ID.
    if (staticBagType === 'wg') {
      if (optGroupName) {
        const groups = Object.keys(WorkingGroup.typeDefinitions) as WorkingGroupKey[]

        if (groups.find((g) => g.toLowerCase() === optGroupName)) {
          return createType<BagId, 'BagId'>('BagId', {
            Static: {
              WorkingGroup: optGroupName as WorkingGroupKey,
            },
          })
        }
        this.invalidBagId(`Unrecognized working group name: ${optGroupName}`)
      }

      this.invalidBagId(`Missing working group name.`)
    }

    this.invalidBagId(`Unrecognized static bag type: ${staticBagType}.`)
  }

  public parseDynamicBagId(): BagId {
    const [, dynamicBagType, entityIdStr] = this.bagIdParts
    if (entityIdStr) {
      const entityId = parseInt(entityIdStr)

      // Verify successful entity ID parsing
      if (!isNaN(entityId)) {
        const resultByType: { [key in DynamicBagTypeKey]: BagId } = {
          Member: createType<BagId, 'BagId'>('BagId', { Dynamic: { Member: entityId } }),
          Channel: createType<BagId, 'BagId'>('BagId', { Dynamic: { Channel: entityId } }),
        }

        for (const [type, result] of Object.entries(resultByType)) {
          if (type.toLowerCase() === dynamicBagType) {
            return result
          }
        }

        this.invalidBagId(`Unrecognized dynamic bag type: ${dynamicBagType}.`)
      }
      this.invalidBagId(`Invalid entity id: ${entityId}.`)
    }

    this.invalidBagId(`Missing entity id.`)
  }
}
