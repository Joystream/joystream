import { StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import { Membership, MembershipEntryMethod, StorageSystemParameters, Worker, WorkerType } from 'query-node/dist/model'
import { workerEntityId } from './workingGroup'
import { storageSystemData, membersData, workingGroupsData } from './bootstrap-data'

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
        createdInBlock: 0,
        entry: MembershipEntryMethod.GENESIS,
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
            type: WorkerType[group],
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.createdAt),
            metadata: w.metadata,
          })
      )
    )
  })
  await Promise.all(workers.map((w) => store.save<Worker>(w)))
}
