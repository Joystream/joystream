import BN from 'bn.js'
import { DatabaseManager, SubstrateEvent } from '@dzlzv/hydra-indexer-lib/lib'

import { Members } from '../generated/types'
import { EntryMethod, Membership } from '../generated/graphql-server/src/modules/membership/membership.model'
import { Block, Network } from '../generated/graphql-server/src/modules/block/block.model'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberRegistered(db: DatabaseManager, substrateEvent: SubstrateEvent): Promise<void> {
  const eventData = new Members.MemberRegisteredEvent(substrateEvent).data
  const callArgs = new Members.BuyMembershipCall(substrateEvent).args

  let block = await db.get(Block, { where: { block: eventData.ctx.blockNumber } })

  if (!block) {
    block = new Block({
      network: Network.BABYLON,
      block: substrateEvent.blockNumber,
      // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
      timestamp: new BN(Date.now()),
    })
    await db.save<Block>(block)
  }

  const member = new Membership({
    id: eventData.memberId.toString(),
    rootAccount: eventData.accountId.toString(),
    controllerAccount: eventData.accountId.toString(),
    handle: callArgs.handle.value.toString(),
    about: callArgs.about.value.toString(),
    avatarUri: callArgs.avatarUri.toString(),
    registeredAtBlock: block,
    // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
    registeredAtTime: new Date(),
    // entry: callArgs.paidTermsId,
  })

  await db.save<Membership>(member)
}
