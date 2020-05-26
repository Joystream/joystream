import { MemberId, Profile, ActorInRole, RoleKeys, Role } from "@joystream/types/members";
import { u128, Vec, Option } from "@polkadot/types/";
import BaseTransport from "./base";
import { MintId, Mint } from "@joystream/types/mint";
import { LeadId } from "@joystream/types/content-working-group";
import { ApiPromise } from "@polkadot/api";
import MembersTransport from "./members";

export default class ContentWorkingGroupTransport extends BaseTransport {
  private membersT: MembersTransport;

  constructor(api: ApiPromise, membersTransport: MembersTransport) {
    super(api);
    this.membersT = membersTransport;
  }

  async currentMintCap(): Promise<number> {
    const WGMintId = (await this.contentWorkingGroup.mint()) as MintId;
    const WGMint = (await this.minting.mints(WGMintId)) as Vec<Mint>;
    return (WGMint[0].get("capacity") as u128).toNumber();
  }

  async currentLead(): Promise<{ id: number; profile: Profile } | null> {
    const optLeadId = (await this.contentWorkingGroup.currentLeadId()) as Option<LeadId>;
    const leadId = optLeadId.unwrapOr(null);

    if (!leadId) return null;

    const actorInRole = new ActorInRole({
      role: new Role(RoleKeys.CuratorLead),
      actor_id: leadId
    });
    const memberId = (await this.members.membershipIdByActorInRole(actorInRole)) as MemberId;
    const profile = (await this.membersT.memberProfile(memberId)).unwrapOr(null);

    return profile && { id: memberId.toNumber(), profile };
  }
}
