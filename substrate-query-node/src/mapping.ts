import { getConnection } from "typeorm";
import * as shortid from "shortid";

import { MemberRegisteredEvent } from "./member";
import { MemberRegistereds } from "./models/members/MemberRegistereds";
import { typeOrmConfigName } from "./config";

export function handleMemberRegistered(event: MemberRegisteredEvent) {
	const member = new MemberRegistereds();
	member.memberId = event.memberId;
	member.accountId = event.accountId;
	member.id = shortid.generate();

	console.log(member);

	getConnection(typeOrmConfigName).getRepository(MemberRegistereds).save(member);
}
