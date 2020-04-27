import { useState, useEffect } from "react";

import { ProposalType } from "./Proposal/ProposalTypePreview";

export function includeKeys<T extends { [k: string]: any }>(obj: T, ...allowedKeys: string[]) {
  return Object.keys(obj).filter(objKey => {
    return allowedKeys.reduce(
      (hasAllowed: boolean, allowedKey: string) => hasAllowed || objKey.includes(allowedKey),
      false
    );
  });
}

export function objFromMap(map: Map<string, any>): { [k: string]: any } {
  return Object.fromEntries(
    Array.from(map.entries(), ([key, value]) => (value instanceof Map ? [key, MapToObject(value)] : [key, value]))
  );
}

export function usePromise<T>(promiseOrFunction: (() => Promise<T>) | Promise<T>, defaultValue: T) {
  const [state, setState] = useState({ value: defaultValue, error: null, isPending: true });

  useEffect(() => {
    const promise = typeof promiseOrFunction === "function" ? promiseOrFunction() : promiseOrFunction;

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

export function calculateStake(type: ProposalType, issuance: number) {
  const basis = issuance / 100;
  let stake = NaN;
  switch (type) {
    case "EvictStorageProvider": {
      stake = basis * 0.1;
      break;
    }
    case "Signal":
    case "SetStorageRoleParams":
    case "SetMaxValidatorCount":
    case "SetLead":
    case "SetWGMintCapacity":
    case "SpendingProposal": {
      stake = basis * 0.25;
      break;
    }
    case "SetElectionParameters": {
      stake = basis * 0.75;
      break;
    }
    case "RuntimeUpgrade": {
      stake = basis * 1;
      break;
    }
    default: {
      throw new Error("'Proposal Type is invalid. Can't calculate issuance.");
    }
  }
  return stake;
}
