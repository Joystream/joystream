import { CreateInterface } from '@joystream/types'
import { PalletStorageStaticBagId as StaticBagId } from '@polkadot/types/lookup'
import BN from 'bn.js'
import { InitDistributionConfig } from './initDistribution'
import { InitStorageConfig } from './initStorage'

export const allStaticBags: CreateInterface<StaticBagId>[] = [
  'Council',
  { WorkingGroup: 'Content' },
  { WorkingGroup: 'Distribution' },
  { WorkingGroup: 'App' },
  { WorkingGroup: 'OperationsAlpha' },
  { WorkingGroup: 'OperationsBeta' },
  { WorkingGroup: 'OperationsGamma' },
  { WorkingGroup: 'Storage' },
]

/**
 * Storage Buckets configuration
 */
export const singleStorageBucketConfig: InitStorageConfig = {
  dynamicBagPolicy: {
    'Channel': 1,
    'Member': 1,
  },
  buckets: [
    {
      metadata: { endpoint: process.env.COLOSSUS_1_URL || 'http://localhost:3333' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
    },
  ],
}

export const doubleStorageBucketConfig: InitStorageConfig = {
  dynamicBagPolicy: {
    'Channel': 2,
    'Member': 2,
  },
  buckets: [
    {
      metadata: { endpoint: process.env.COLOSSUS_1_URL || 'http://localhost:3333' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
    },
    {
      metadata: { endpoint: process.env.COLOSSUS_2_URL || 'http://localhost:3335' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_2_TRANSACTOR_URI || '//Colossus2',
    },
  ],
}

/**
 * Distribution Buckets configuration
 */
export const singleDistributionBucketConfig: InitDistributionConfig = {
  families: [
    {
      metadata: { region: 'All' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_1_URL || 'http://localhost:3334' },
          staticBags: allStaticBags,
        },
      ],
    },
  ],
}

export const doubleDistributionBucketConfig: InitDistributionConfig = {
  families: [
    {
      metadata: { region: 'Region 1' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_1_URL || 'http://localhost:3334' },
          staticBags: allStaticBags,
        },
      ],
    },
    {
      metadata: { region: 'Region 2' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_2_URL || 'http://localhost:3336' },
          staticBags: allStaticBags,
        },
      ],
    },
  ],
}
