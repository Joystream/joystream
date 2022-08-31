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

export type DisplaySafeConfig = Omit<Config, 'keys' | 'operatorApi'> & {
  keys?: (Secret<SubstrateUri> | Secret<MnemonicPhrase> | Secret<JSONBackupFile>)[]
  operatorApi?: Secret<Config['operatorApi']>
}

export type ReadonlyConfig = DeepReadonly<Config>
