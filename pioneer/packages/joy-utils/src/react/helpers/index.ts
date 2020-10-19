import React from 'react';
import { Options as QueryOptions } from '@polkadot/react-api/hoc/types';

export function componentName (WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

/** Example of apiQuery: 'query.councilElection.round' */
export function queryToProp (apiQuery: string, paramNameOrOpts?: string | QueryOptions): [string, QueryOptions] {
  let paramName: string | undefined;
  let propName: string | undefined;

  if (typeof paramNameOrOpts === 'string') {
    paramName = paramNameOrOpts;
  } else if (paramNameOrOpts) {
    paramName = paramNameOrOpts.paramName;
    propName = paramNameOrOpts.propName;
  }

  // If prop name is still undefined, derive it from the name of storage item:
  if (!propName) {
    propName = apiQuery.split('.').slice(-1)[0];
  }

  return [apiQuery, { paramName, propName }];
}

export { Controller } from './Controller';
export { Observable } from './Observable';
export { Subscribable } from './Subscribable';
