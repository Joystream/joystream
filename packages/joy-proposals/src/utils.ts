import { useState, useEffect, useCallback } from "react";
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

export function splitOnUpperCase(str: string) {
  return str.split(/(?=[A-Z])/);
}

export function slugify(str: string) {
  return splitOnUpperCase(str)
    .map(w => w.toLowerCase())
    .join("-")
    .trim();
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

export function usePromise<T>(promise: () => Promise<T>, defaultValue: T): [T, any, boolean] {
  const [state, setState] = useState<{
    value: T;
    error: any;
    isPending: boolean;
  }>({ value: defaultValue, error: null, isPending: true });

  let isSubscribed = true;
  const execute = useCallback(() => {
    return promise()
      .then(value => (isSubscribed ? setState({ value, error: null, isPending: false }) : null))
      .catch(error => (isSubscribed ? setState({ value: defaultValue, error: error, isPending: false }) : null));
  }, [promise]);

  useEffect(() => {
    execute();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const { value, error, isPending } = state;
  return [value, error, isPending];
}

export function calculateStake(type: ProposalType, issuance: number) {
  let stake = NaN;
  switch (type) {
    case "EvictStorageProvider": {
      stake = Math.round(issuance * (0.1 / 100));
      break;
    }
    case "Text":
    case "SetStorageRoleParams":
    case "SetValidatorCount":
    case "SetLead":
    case "SetContentWorkingGroupMintCapacity":
    case "Spending": {
      stake = Math.round(issuance * (0.25 / 100));
      break;
    }
    case "SetElectionParameters": {
      stake = Math.round(issuance * (0.75 / 100));
      break;
    }
    case "RuntimeUpgrade": {
      stake = Math.round(issuance * (1 / 100));
      break;
    }
    default: {
      throw new Error(`Proposal Type is invalid. Got ${type}. Can't calculate issuance.`);
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
    case "Text": {
      description = "Signal Proposal";
      category = "Other";
      break;
    }
    case "SetStorageRoleParams": {
      description = "Set Storage Role Params Proposal";
      category = "Storage";
      break;
    }
    case "SetValidatorCount": {
      description = "Set Max Validator Count Proposal";
      category = "Validators";
      break;
    }
    case "SetLead": {
      description = "Set Lead Proposal";
      category = "Content Working Group";
      break;
    }
    case "SetContentWorkingGroupMintCapacity": {
      description = "Set WG Mint Capacity Proposal";
      category = "Content Working Group";
      break;
    }
    case "Spending": {
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
