import { Membership } from '../generated/graphql-server/src/modules/membership/membership.model';
import { DB, getLogger } from '../generated/indexer';

import { ApiPromise } from '@polkadot/api';
import { Hash } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types/codec';
import type { Profile } from '@joystream/types/lib/members';
import { Codec } from '@polkadot/types/types';

const logger = getLogger();

export async function bootMembers(api: ApiPromise, db: DB) {

    let blkHeight: number = process.env.BLOCK_HEIGHT ? parseInt(process.env.BLOCK_HEIGHT) : 0;
    let blkHash: Hash = await api.rpc.chain.getBlockHash(blkHeight);
    let ids = await api.query.members.membersCreated.at(blkHash);
    let num: number = parseInt(ids.toString())
      
    for (let i = 0; i < num; i++) {
        let profileOpt = await api.query.members.memberProfile.at(blkHash, i) as Option<Profile & Codec>;
        let profile: Profile | null = profileOpt.unwrapOr(null);
        
        if (!profile) {
            continue
        }

        let member = new Membership()
        member.accountId= profile.root_account.toString(), 
        member.handle= profile.handle.toString(),
        member.avatarUri= profile.avatar_uri.toString(),
        member.about= profile.about.toString(),
        member.memberId= i 
        
        
        logger.trace(`Saving member: ${JSON.stringify(member, null, 2)}`);
        await db.save<Membership>(member);
        logger.info(`Saved members: ${i}/${num}`)
    }
    logger.info(`Done bootstrapping members!`);
        
}