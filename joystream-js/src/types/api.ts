import { AugmentedQueries } from '@polkadot/api/types/storage'

export type ApiModuleKey = keyof AugmentedQueries<'promise'>
export type ApiMethodKey<M extends ApiModuleKey> = keyof AugmentedQueries<'promise'>[M]
