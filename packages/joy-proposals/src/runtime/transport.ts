import { u64 } from "@polkadot/types";
import { AccountId } from "@polkadot/types/interfaces";

type ProposalId = u64;

export default abstract class Transport {
  abstract allProposals(): Promise<any[]>;

  async proposalById(id: ProposalId): Promise<any> {
    return (await this.allProposals()).find((prop) => id.eq(prop.id));
  }

  async proposalsByAccount(accountId: AccountId): Promise<any> {
    return (await this.allProposals()).filter((x) => accountId && accountId.eq(x.roleAccount));
  }
}
