import { useState, useEffect } from 'react';

export function usePromise<T> (promiseOrFunction: (() => Promise<T>) | Promise<T>, defaultValue: T) {
  const [state, setState] = useState({ value: defaultValue, error: null, isPending: true });

  useEffect(() => {
    const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;

    let isSubscribed = true;
    promise
      .then(value => (isSubscribed ? setState({ value, error: null, isPending: false }) : null))
      .catch(error => (isSubscribed ? setState({ value: defaultValue, error: error, isPending: false }) : null));

    return () => {
      isSubscribed = false;
    };
  }, []);

  const { value, error, isPending } = state;
  return [value, error, isPending];
}

export function calculateStake (type: string, issuance: number): number {
  const basis = issuance / 100;
  let stake = NaN;
  switch (type) {
    case 'EvictStorageProvider': {
      stake = basis * 0.1;
      break;
    }
    case 'Signal':
    case 'SetStorageRoleParams':
    case 'SetMaxValidatorCount':
    case 'SetLead':
    case 'SetWGMintCapacity':
    case 'SpendingProposal': {
      stake = basis * 0.25;
      break;
    }
    case 'SetElectionParameters': {
      stake = basis * 0.75;
      break;
    }
    case 'RuntimeUpgrade': {
      stake = basis * 1;
      break;
    }
    default: {
      throw new Error("'Proposal Type is invalid. Can't calculate issuance.");
    }
  }
  return stake;
}
