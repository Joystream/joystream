import * as assert from 'assert';

import { Membership } from '../generated/indexer/entities/Membership';
import { DB, getLogger } from '../generated/indexer';

export async function handleMemberRegistered(db: DB) {
  // Get event data
  const { AccountId, MemberId } = db.event.event_params;

  let member = new Membership({ accountId: AccountId.toString(), memberId: +MemberId });

  // Save to database.
  db.save<Membership>(member);
}

export async function handleMemberUpdatedAboutText(db: DB) {
  // Get event data
  const { MemberId } = db.event.event_params;

  // Query from database since it is an existsing user
  const member = await db.get(Membership, { where: { memberId: MemberId } });

  assert(member);

  // Member data is updated at: now
  member.updatedAt = new Date();

  // Save back to database.
  db.save<Membership>(member);
}
