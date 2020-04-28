import { useState, useEffect } from "react";
import { BlockNumber } from "@polkadot/types/interfaces";

import { ProposalType } from "./runtime";
import { Category } from "./Proposal/ChooseProposalType";

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
    Array.from(map.entries(), ([key, value]) => (value instanceof Map ? [key, objFromMap(value)] : [key, value]))
  );
}

export function dateFromBlock(blockNumber: BlockNumber) {
  const _blockNumber = blockNumber.toNumber();
  return new Date(Date.now() - 6000 * _blockNumber);
}

export function usePromise<T>(promiseOrFunction: (() => Promise<T>) | Promise<T>, defaultValue: T): [T, any, boolean] {
  const [state, setState] = useState<{
    value: T;
    error: null | any;
    isPending: boolean;
  }>({ value: defaultValue, error: null, isPending: true });

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

export function calculateMetaFromType(type: ProposalType) {
  let description = "";
  const image = "";
  let category: Category = "Other";
  switch (type) {
    case "EvictStorageProvider": {
      description = "Evicting Storage Provider Proposal";
      category = "Storage";
      break;
    }
    case "Signal": {
      description = "Signal Proposal";
      category = "Other";
      break;
    }
    case "SetStorageRoleParams": {
      description = "Set Storage Role Params Proposal";
      category = "Storage";
      break;
    }
    case "SetMaxValidatorCount": {
      description = "Set Max Validator Count Proposal";
      category = "Validators";
      break;
    }
    case "SetLead": {
      description = "Set Lead Proposal";
      category = "Content Working Group";
      break;
    }
    case "SetWGMintCapacity": {
      description = "Set WG Mint Capacity Proposal";
      category = "Content Working Group";
      break;
    }
    case "SpendingProposal": {
      description = "Spending Proposal";
      category = "Other";
      break;
    }
    case "SetElectionParameters": {
      description = "Set Election Parameters Proposal";
      category = "Council";
      break;
    }
    case "RuntimeUpgrade": {
      description = "Runtime Upgrade Proposal";
      category = "Other";
      break;
    }
    default: {
      throw new Error("'Proposal Type is invalid. Can't calculate metadata.");
    }
  }
  return { description, image, category };
}
