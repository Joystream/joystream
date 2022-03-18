import { EventContext, StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import { BudgetUpdatedEvent, WorkingGroup } from 'query-node/dist/model'
import { JoystreamUtility } from '../generated/types'
import { genericEventFields, getWorkingGroupByName, getWorkingGroupModuleName } from './common'

export async function joystreamUtility_UpdatedWorkingGroupBudget({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [workingGroup, amount, amountType] = new JoystreamUtility.UpdatedWorkingGroupBudgetEvent(event).params
  const group = await getWorkingGroupByName(store, getWorkingGroupModuleName(workingGroup))
  const budgetChangeAmount = new BN(amountType.isNegative ? `-${amount.toString()}` : amount.toString())
  group.budget = group.budget.add(budgetChangeAmount)
  await store.save<WorkingGroup>(group)

  const budgetUpdatedEvent = new BudgetUpdatedEvent({ ...genericEventFields(event), group, budgetChangeAmount })
  await store.save<BudgetUpdatedEvent>(budgetUpdatedEvent)
}
