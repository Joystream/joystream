import {
  DistributorNodeConfiguration as ConfigJson,
  JSONBackupFile,
  SubstrateUri,
  MnemonicPhrase,
} from './generated/ConfigJson'
import { DeepReadonly } from './common'

export type Config = Omit<ConfigJson, 'limits'> & {
  version: string
  limits: Omit<ConfigJson['limits'], 'storage' | 'maxCachedItemSize'> & {
    storage: number
    maxCachedItemSize?: number
  }
}

type Secret<T> = { [K in keyof T]: '###SECRET###' }

type NonNullableLogsConfig = NonNullable<Config['logs']>
type NonNullableLogsElasticConfig = NonNullable<NonNullableLogsConfig['elastic']>
export type DisplaySafeConfig = Omit<Config, 'keys' | 'operatorApi' | 'logs'> & {
  keys?: (Secret<SubstrateUri> | Secret<MnemonicPhrase> | Secret<JSONBackupFile>)[]
  operatorApi?: Secret<Config['operatorApi']>
  logs?: Omit<NonNullableLogsConfig, 'elastic'> & {
    elastic?: Omit<NonNullableLogsElasticConfig, 'auth'> & {
      auth?: Secret<NonNullableLogsElasticConfig['auth']>
    }
  }
}

export type ReadonlyConfig = DeepReadonly<Config>
