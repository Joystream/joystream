import { Memberships } from '../generated/indexer/entities/Memberships';
import { DB } from '../generated/indexer';
import { ApiPromise } from '@polkadot/api';
import { QueryRunner, DeepPartial } from 'typeorm';
import { Hash } from '@polkadot/types/interfaces';
import { Option } from '@polkadot/types/codec';
import type { Profile } from '@joystream/types/lib/members';
import { fillRequiredWarthogFields } from  '../generated/indexer/node_modules/index-builder/lib/db/helper'
import { SavedEntityEvent } from  '../generated/indexer/node_modules/index-builder/lib/db'
import { Codec } from '@polkadot/types/types';

const debug = require('debug')('indexer:mappings')

export async function handleMemberRegistered(db: DB) {
  // Get event data
  const { AccountId, MemberId } = db.event.event_params;

  let member = new Memberships({ accountId: AccountId.toString(), memberId: +MemberId });

  // Save to database.
  db.save<Memberships>(member);

  // Query from database
  await db.get(Memberships, { where: { memberId: MemberId } });
}

export async function handleMemberUpdatedAboutText(db: DB) {
  // Get event data
  const { MemberId } = db.event.event_params;

  // Query from database since it is an existsing user
  const member = await db.get(Memberships, { where: { memberId: MemberId } });

  // Make sure member exists
  if (member) {
    // Member data is updated at: now
    //member.updatedAt = new Date();

    // Save back to database.
    db.save<Memberships>(member);
  }
}


export async function bootMembers(api: ApiPromise, queryRunner: QueryRunner) {
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

        let member: DeepPartial<Memberships> = new Memberships({ 
            accountId: profile.root_account.toString(), 
            handle: profile.handle.toString(),
            avatarUri: profile.avatar_uri.toString(),
            about: profile.about.toString(),
            memberId: i 
        });
        
        member = fillRequiredWarthogFields(member);
        await queryRunner.manager.insert(Memberships, member);
        const bootEvent = {
            event_name: 'Bootstrap',
            event_method: 'bootMembers',
            event_params: {},
            index: i,
            block_number: 0, // TODO: use other block for bootstrap?
        };
    
        await SavedEntityEvent.update(bootEvent, queryRunner.manager);
        debug(`Saving members: ${i}/${num}`)
        
    }
    debug(`Done bootstrapping members!`);
        
}