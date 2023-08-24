import { EventContext, StoreContext } from '@joystream/hydra-common';
import { Members_MemberCreatedEvent_V1001 } from "generated/types"
import { MembershipEntryMemberCreated, Validator } from 'query-node/dist/model';

export async function validator_created({ store, event }: EventContext & StoreContext): Promise<void> {
    const [memberId, memberParameters, inviteCount] = new Members_MemberCreatedEvent_V1001(event).params
  
    const memberEntry = new MembershipEntryMemberCreated()

  
    const memberCreatedEvent = new Validator({

    })

    // await store.save<Validator>(member)
  }
  