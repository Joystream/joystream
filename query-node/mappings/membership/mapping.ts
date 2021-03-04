
import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { DatabaseManager, SubstrateEvent } from '@dzlzv/hydra-indexer-lib/lib'

import { Members } from '../generated/types'
import { EntryMethod, Membership } from '../generated/graphql-server/src/modules/membership/membership.model'
import { Block, Network } from '../generated/graphql-server/src/modules/block/block.model'

async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
    const member = await db.get(Membership, { where: { id: id.toString() } })
    if (!member) throw Error(`Member(${id}) not found`)
    return member
  }