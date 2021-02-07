import BN from 'bn.js'
import { ApiPromise } from '@polkadot/api'
import { Option } from '@polkadot/types/codec'
import { Codec } from '@polkadot/types/types'
import { Membership as Profile } from '@joystream/types/members'

import { DB, getLogger } from '../../generated/hydra-processor'
import { Block, Network } from '../../generated/graphql-server/src/modules/block/block.model'
import { Membership } from '../../generated/graphql-server/src/modules/membership/membership.model'

const logger = getLogger()

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_bootMembers(api: ApiPromise, db: DB): Promise<void> {
  const blkHeight = process.env.BLOCK_HEIGHT ? parseInt(process.env.BLOCK_HEIGHT) : 0
  const blkHash = await api.rpc.chain.getBlockHash(blkHeight)
  const ids = await api.query.members.membersCreated.at(blkHash)
  const num: number = parseInt(ids.toString())

  let block = await db.get(Block, { where: { block: blkHeight } })

  if (!block) {
    block = new Block({
      network: Network.BABYLON,
      block: blkHeight,
      // TODO: upgrade indexer-lib which support block timestamp: substrateEvent.timestamp
      timestamp: new BN(Date.now()),
    })
    await db.save<Block>(block)
  }

  for (let i = 0; i < num; i++) {
    const profileOpt = (await api.query.members.memberProfile.at(blkHash, i)) as Option<Profile & Codec>
    const profile: Profile | null = profileOpt.unwrapOr(null)

    if (!profile) {
      continue
    }

    const member = new Membership()
    member.id = i.toString()
    member.handle = profile.handle.toString()
    member.avatarUri = profile.avatar_uri.toString()
    member.about = profile.about.toString()

    member.rootAccount = profile.root_account.toString()
    member.controllerAccount = profile.controller_account.toString()
    member.registeredAtBlock = block

    logger.trace(`Saving member: ${JSON.stringify(member, null, 2)}`)
    await db.save<Membership>(member)
    logger.info(`Saved members: ${i}/${num}`)
  }
  logger.info(`Done bootstrapping members!`)
}
