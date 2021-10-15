import { DistributorNodeConfiguration as ConfigJson } from './generated/ConfigJson'
import { DeepReadonly } from './common'

export type Config = Omit<ConfigJson, 'limits'> & {
  limits: Omit<ConfigJson['limits'], 'storage'> & {
    storage: number
  }
}
export type ReadonlyConfig = DeepReadonly<Config>
