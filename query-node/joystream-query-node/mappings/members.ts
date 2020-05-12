import { Memberships } from '../generated/indexer/entities/Memberships';
import { DB } from '../generated/indexer';

export async function handleMemberRegistered(db: DB) {
  // Get event data
  const { AccountId, MemberId } = db.event.event_params;

  let member = new Memberships({ accountId: AccountId.toString(), memberId: +MemberId });

  // Save to database.
  db.save<Memberships>(member);

  // Query from database
  member = await db.get(Memberships, { where: { memberId: MemberId } });
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
