import * as assert from 'assert';

import { Membership } from '../generated/graphql-server/src/modules/membership/membership.model';
import { DB, SubstrateEvent } from '../generated/indexer';

export async function handleMemberRegistered(db: DB, event: SubstrateEvent) {
  // Get event data
  const { AccountId, MemberId } = event.event_params;

  let member = new Membership();
  member.accountId = AccountId.toString()
  member.memberId = +MemberId

  // Save to database.
  db.save<Membership>(member);
}

export async function handleMemberUpdatedAboutText(db: DB, event: SubstrateEvent) {
  // Get event data
  const { MemberId } = event.event_params;

  // Query from database since it is an existsing user
  const member = await db.get(Membership, { where: { memberId: MemberId } });

  assert(member);

  // Member data is updated at: now
  member.updatedAt = new Date();

  // Save back to database.
  db.save<Membership>(member);
}
