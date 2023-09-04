import { ApiPromise } from '@polkadot/api'
import logger from '../../services/logger'
import { u64 } from '@polkadot/types/primitive'

export async function getLeadWorkerId(api: ApiPromise): Promise<u64 | undefined> {
  const currentLead = await api.query.storageWorkingGroup.currentLead()

  if (currentLead.isSome) {
    return currentLead.unwrap()
  }

  logger.error('There is no active storage lead')
}

export async function getWorkerRoleAccount(api: ApiPromise, workerId: number | u64): Promise<string | undefined> {
  const worker = await api.query.storageWorkingGroup.workerById(workerId)

  if (worker.isSome) {
    return worker.unwrap().roleAccountId.toString()
  }

  logger.error(`Worker id ${workerId} does not exist`)
}

export async function getLeadRoleAccount(api: ApiPromise): Promise<string | undefined> {
  const leadWorkerId = await getLeadWorkerId(api)

  if (leadWorkerId !== undefined) {
    return getWorkerRoleAccount(api, leadWorkerId)
  }
}
