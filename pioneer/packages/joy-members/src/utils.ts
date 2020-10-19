// TODO: Move to joy-utils?
import { queryToProp } from '@polkadot/joy-utils/react/helpers';
import { Options as QueryOptions } from '@polkadot/react-api/hoc/types';

export const queryMembershipToProp = (storageItem: string, paramNameOrOpts?: string | QueryOptions) => {
  return queryToProp(`query.members.${storageItem}`, paramNameOrOpts);
};
