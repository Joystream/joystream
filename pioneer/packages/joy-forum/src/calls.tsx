
import React from 'react';
import { ApiProps, SubtractProps } from '@polkadot/react-api/types';
import { Options } from '@polkadot/react-api/with/types';
import { withApi, withCall as withSubstrateCall } from '@polkadot/react-api';
import { Option } from '@polkadot/types/codec';
import { AccountId } from '@polkadot/types/interfaces';
import { u64 } from '@polkadot/types';
import { Constructor } from '@polkadot/types/types';
import { Category, Thread, Reply } from '@joystream/types/lib/forum';
import { useForum, ForumState } from './Context';

type Call = string | [string, Options];

type StorageType = 'substrate' | 'react';

const storage: StorageType = 'substrate';

type EntityMapName = 'categoryById' | 'threadById' | 'replyById';

const getReactValue = (state: ForumState, endpoint: string, paramValue: any): any => {

  const getEntityById = (mapName: EntityMapName, constructor: Constructor): any => {
    const id = (paramValue as u64).toNumber();
    const entity = state[mapName].get(id);
    return new constructor(entity);
  };

  switch (endpoint) {
    case 'forumSudo': return new Option<AccountId>('AccountId', state.sudo);
    case 'categoryById': return getEntityById(endpoint, Category);
    case 'threadById': return getEntityById(endpoint, Thread);
    case 'replyById': return getEntityById(endpoint, Reply);
    default: throw new Error('Unknown endpoint for Forum storage');
  }
};

function withReactCall<P extends ApiProps> (endpoint: string, { paramName, propName }: Options = {}): (Inner: React.ComponentType<ApiProps>) => React.ComponentType<any> {
  return (Inner: React.ComponentType<ApiProps>): React.ComponentType<SubtractProps<P, ApiProps>> => {

    const SetProp = (props: P) => {
      const { state } = useForum();
      const paramValue = paramName ? (props as any)[paramName] as any : undefined;
      const propValue = getReactValue(state, endpoint, paramValue);
      const _propName = propName || endpoint;
      const _props = {
        ...props,
        [_propName]: propValue
      };
      return <Inner {..._props} />;
    };

    return withApi(SetProp);
  };
}

function withForumCall<P extends ApiProps> (endpoint: string, opts: Options = {}): (Inner: React.ComponentType<ApiProps>) => React.ComponentType<any> {
  if (!opts.propName) {
    opts.propName = endpoint;
  }
  if (storage === 'react') {
    return withReactCall(endpoint, opts);
  } else {
    endpoint = 'query.forum.' + endpoint;
    return withSubstrateCall(endpoint, opts);
  }
}

// Heavily based on @polkadot/ui-api/src/with/calls.ts
export function withForumCalls <P> (...calls: Array<Call>): (Component: React.ComponentType<P>) => React.ComponentType<SubtractProps<P, ApiProps>> {
  return (Component: React.ComponentType<P>): React.ComponentType<any> => {
    // NOTE: Order is reversed so it makes sense in the props, i.e. component
    // after something can use the value of the preceding version
    return calls
      .reverse()
      .reduce((Component, call) => {
        return Array.isArray(call)
          ? withForumCall(...call)(Component as any)
          : withForumCall(call)(Component as any);
      }, Component);
  };
}
