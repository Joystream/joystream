import { Memberships } from '../generated/indexer/entities/Memberships';
import { DB } from '../generated/indexer';
import { ApiPromise } from '../generated/indexer/node_modules/@polkadot/api';
import { QueryRunner, DeepPartial } from '../generated/indexer/node_modules/typeorm';
import { Hash } from '../generated/indexer/node_modules/@polkadot/types/interfaces';
import { Option } from '../generated/indexer/node_modules/@polkadot/types/codec';
import type { Profile } from '../generated/indexer/node_modules/@joystream/types/lib/members';
import { fillRequiredWarthogFields } from  '../generated/indexer/node_modules/index-builder/lib/db/helper'
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
    member.updatedAt = new Date();

    // Save back to database.
    db.save<Memberships>(member);
  }
}

export async function bootMembers(api: ApiPromise, queryRunner: QueryRunner) {
    let blkHash: Hash = await api.rpc.chain.getBlockHash(0);
    let ids = await api.query.members.membersCreated.at(blkHash);
    let num: number = parseInt(ids.toString())
    let members = [];
    for (let i = 0; i < num; i++) {
        let profileOpt = await api.query.members.memberProfile.at(blkHash, i) as Option<Profile>;
        let profile: Profile | null = profileOpt.unwrapOr(null);
        
        if (!profile) {
            continue
        }

        let member: DeepPartial<Memberships> = new Memberships({ 
            accountId: profile.root_account.toString(), 
            handle: profile.handle.toString(),
            avatarUri: profile.avatar_uri.toString(),
            about: profile.about.toString(),
            memberId: i // what should be here?
        });
        
        member = fillRequiredWarthogFields(member);
        members.push(member);
        debug(`BootstrapEnitity: ${JSON.stringify(member, null, 2)}`);
        if ((members.length == 25) || (i == num - 1)) {
            if (members.length == 0) {
                continue;
            }
            await queryRunner.manager.insert(Memberships, members);
            members = [];
        }
    }
    debug(`Done bootstrapping members!`);
        
}