import { ConfigJson } from './generated/ConfigJson'
import { DeepReadonly } from './common'

export type Config = ConfigJson
export type ReadonlyConfig = DeepReadonly<Config>
