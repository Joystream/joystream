import { ConfigJson } from './generated/ConfigJson'
import { DeepReadonly } from './common'

export type Config = Omit<ConfigJson, 'storageLimit'> & {
  storageLimit: number
}
export type ReadonlyConfig = DeepReadonly<Config>
