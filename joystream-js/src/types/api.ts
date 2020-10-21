import { AugmentedQueries } from '@polkadot/api/types/storage'
import { SubmittableExtrinsics } from '@polkadot/api/types/submittable'
import { Constants } from '@polkadot/metadata/Decorated/consts/types'

export type ApiQueryModuleKey = keyof AugmentedQueries<'promise'>
export type ApiQueryMethodKey<M extends ApiQueryModuleKey> = keyof AugmentedQueries<'promise'>[M]
export type ApiTxModuleKey = keyof SubmittableExtrinsics<'promise'>
export type ApiTxMethodKey<M extends ApiTxModuleKey> = keyof SubmittableExtrinsics<'promise'>[M]
export type ApiConstsModuleKey = keyof Constants
