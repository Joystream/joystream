import { StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import {
  Membership,
  MembershipEntryMethod,
  StorageSystemParameters,
  Worker,
  WorkerType,
  ChannelCategory,
  VideoCategory,
} from 'query-node/dist/model'
import { workerEntityId } from './workingGroup'
import {
  storageSystemData,
  membersData,
  workingGroupsData,
  videoCategoriesData,
  channelCategoriesData,
} from './bootstrap-data'

export async function bootstrapData({ store }: StoreContext): Promise<void> {
  // Storage system
  await store.save<StorageSystemParameters>(
    new StorageSystemParameters({
      ...storageSystemData,
      storageBucketMaxObjectsCountLimit: new BN(storageSystemData.storageBucketMaxObjectsCountLimit),
      storageBucketMaxObjectsSizeLimit: new BN(storageSystemData.storageBucketMaxObjectsSizeLimit),
      dataObjectFeePerMb: new BN(storageSystemData.dataObjectFeePerMb),
    })
  )

  // Members
  const members = membersData.map(
    (m) =>
      new Membership({
        // main data
        id: m.memberId,
        rootAccount: m.rootAccount,
        controllerAccount: m.controllerAccount,
        handle: m.handle,
        about: m.about,
        avatarUri: m.avatarUri,
        createdInBlock: m.registeredAtBlock,
        entry: m.registeredAtBlock === 1 ? MembershipEntryMethod.GENESIS : MembershipEntryMethod.PAID,
        // fill in auto-generated fields
        createdAt: new Date(m.registeredAtTime),
        updatedAt: new Date(m.registeredAtTime),
      })
  )
  await Promise.all(members.map((m) => store.save<Membership>(m)))

  // Workers
  let workers: Worker[] = []
  ;(['GATEWAY', 'STORAGE'] as const).map((group) => {
    const workersJson = workingGroupsData[group]?.workers || []
    workers = workers.concat(
      workersJson.map(
        (w) =>
          new Worker({
            id: workerEntityId(WorkerType[group], w.workerId),
            workerId: w.workerId,
            isActive: true,
            type: WorkerType[group],
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.createdAt),
            metadata: w.metadata,
          })
      )
    )
  })
  await Promise.all(workers.map((w) => store.save<Worker>(w)))

  const channelCategories = channelCategoriesData.map(
    (m) =>
      new ChannelCategory({
        id: m.id,
        name: m.name,
        channels: [],
        createdInBlock: m.createdInBlock,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })
  )
  await Promise.all(channelCategories.map((m) => store.save<ChannelCategory>(m)))

  const videoCategories = videoCategoriesData.map(
    (m) =>
      new VideoCategory({
        id: m.id,
        name: m.name,
        videos: [],
        createdInBlock: m.createdInBlock,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })
  )
  await Promise.all(videoCategories.map((m) => store.save<VideoCategory>(m)))
}
