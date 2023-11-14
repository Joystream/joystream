import { flags } from '@oclif/command'
import ExitCodes from './ExitCodes'
import { CLIError } from '@oclif/errors'
import { parseBagId } from '../services/helpers/bagTypes'

export const customFlags = {
  // 'integer array' oclif flag.
  integerArr: flags.build({
    parse: (value: string) => {
      const arr: number[] = value.split(',').map((v) => {
        if (!/^-?\d+$/.test(v)) {
          throw new CLIError(`Expected comma-separated integers, but received: ${value}`, {
            exit: ExitCodes.InvalidIntegerArray,
          })
        }
        return parseInt(v)
      })
      return arr
    },
  }),
  // BagId
  bagId: flags.build({
    parse: (value: string) => {
      return parseBagId(value)
    },
    description: `Bag ID. Format: {bag_type}:{sub_type}:{id}.
  - Bag types: 'static', 'dynamic'
  - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
  - Id:
    - absent for 'static:council'
    - working group name for 'static:wg'
    - integer for 'dynamic:member' and 'dynamic:channel'
  Examples:
  - static:council
  - static:wg:storage
  - dynamic:member:4`,
  }),
}
