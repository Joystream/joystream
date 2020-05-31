import BaseTransport from './base';
import { IStorageRoleParameters } from "../types/storageProviders";
import { RoleKeys } from "@joystream/types/members";
import { Vec } from "@polkadot/types/";
import { AccountId } from "@polkadot/types/interfaces";

export default class StorageProvidersTransport extends BaseTransport {
  async roleParameters(): Promise<IStorageRoleParameters> {
    const params = (
      await this.api.query.actors.parameters(RoleKeys.StorageProvider)
    ).toJSON() as IStorageRoleParameters;
    return params;
  }

  async providers(): Promise<AccountId[]> {
    const providers = (await this.actors.accountIdsByRole(RoleKeys.StorageProvider)) as Vec<AccountId>;
    return providers.toArray();
  }
}
