import { queryToProp } from '@polkadot/joy-utils/index';
import { Options as QueryOptions } from '@polkadot/react-api/with/types';

export const queryMembershipToProp = (storageItem: string, paramNameOrOpts?: string | QueryOptions) => {
  return queryToProp(`query.members.${storageItem}`, paramNameOrOpts);
};
