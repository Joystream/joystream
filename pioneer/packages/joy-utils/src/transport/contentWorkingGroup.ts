import { Membership } from '@joystream/types/members';
import { u128, Option } from '@polkadot/types/';
import BaseTransport from './base';
import { MintId, Mint } from '@joystream/types/mint';
import { LeadId, Lead } from '@joystream/types/content-working-group';
import { ApiPromise } from '@polkadot/api';
import MembersTransport from './members';
import { APIQueryCache } from './APIQueryCache';

export default class ContentWorkingGroupTransport extends BaseTransport {
  private membersT: MembersTransport;

  constructor (api: ApiPromise, cacheApi: APIQueryCache, membersTransport: MembersTransport) {
    super(api, cacheApi);
    this.membersT = membersTransport;
  }

  async currentMintCap (): Promise<number> {
    const WGMintId = (await this.contentWorkingGroup.mint()) as MintId;
    const WGMint = (await this.minting.mints(WGMintId)) as Mint;

    return (WGMint.get('capacity') as u128).toNumber();
  }

  async currentLead (): Promise<{ id: number; profile: Membership } | null> {
    const optLeadId = (await this.contentWorkingGroup.currentLeadId()) as Option<LeadId>;
    const leadId = optLeadId.unwrapOr(null);

    if (!leadId) return null;

    const lead = await this.contentWorkingGroup.leadById(leadId) as Lead;

    if (lead.isEmpty || !lead.stage.isOfType('Active')) {
      return null;
    }

    const profile = await this.membersT.expectedMembership(lead.member_id);

    return profile && { id: lead.member_id.toNumber(), profile };
  }
}
