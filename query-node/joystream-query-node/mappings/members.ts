import { Memberships } from '../generated/indexer/entities/Memberships';
import { DB } from '../generated/indexer';

export async function handleMemberRegistered(db: DB) {
  // Get event data
  const { AccountId, MemberId } = db.event.event_params;

  const member = new Memberships({ accountId: AccountId.toString(), memberId: +MemberId });

  // Save to database.
  db.save<Memberships>(member);

  // Query from database
  const m = await db.get(Memberships, { where: { memberId: MemberId } });
}
