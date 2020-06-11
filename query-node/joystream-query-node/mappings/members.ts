import * as assert from 'assert';

import { Member } from '../generated/graphql-server/src/modules/member/member.model';
import { DB, SubstrateEvent } from '../generated/indexer';

export async function handleMemberRegistered(db: DB, event: SubstrateEvent) {
  const { AccountId, MemberId } = event.event_params;

  let member = new Member();
  member.rootAccount = Buffer.from(AccountId);
  member.memberId = MemberId.toString();

  db.save<Member>(member);
}

export async function handleMemberUpdatedAboutText(db: DB, event: SubstrateEvent) {
  const { MemberId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  member.updatedAt = new Date();
  db.save<Member>(member);
}

  // Save back to database.
  db.save<Membership>(member);
}
