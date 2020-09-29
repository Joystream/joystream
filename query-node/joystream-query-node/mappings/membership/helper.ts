import * as BN from "bn.js";

import { Member } from "../../generated/graphql-server/src/modules/member/member.model";
import { DB } from "../../generated/indexer";

export async function getMemberById(db: DB, memberId: string): Promise<Member | undefined> {
	return db.get(Member, { where: { memberId: new BN(memberId) } });
}
