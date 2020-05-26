import { ProposalType, ProposalMeta } from "../types/proposals";

// TODO: Those may actually be const objects (now that we don't need total issuance etc.)

export function calculateStake(type: ProposalType) {
  let stake = NaN;
  switch (type) {
    case "EvictStorageProvider": {
      stake = 25000;
      break;
    }
    case "Text":
      stake = 25000;
      break;
    case "SetStorageRoleParameters":
      stake = 100000;
      break;
    case "SetValidatorCount":
      stake = 100000;
      break;
    case "SetLead":
      stake = 50000;
      break;
    case "SetContentWorkingGroupMintCapacity":
      stake = 50000;
      break;
    case "Spending": {
      stake = 25000;
      break;
    }
    case "SetElectionParameters": {
      stake = 200000;
      break;
    }
    case "RuntimeUpgrade": {
      stake = 1000000;
      break;
    }
    default: {
      throw new Error(`Proposal Type is invalid. Got ${type}.`);
    }
  }
  return stake;
}

export function calculateMetaFromType(type: ProposalType): ProposalMeta {
  const image = "";
  switch (type) {
    case "EvictStorageProvider": {
      return {
        description: "Evicting Storage Provider Proposal",
        category: "Storage",
        image,
        approvalQuorum: 50,
        approvalThreshold: 75,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "Text": {
      return {
        description: "Signal Proposal",
        category: "Other",
        image,
        approvalQuorum: 60,
        approvalThreshold: 80,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "SetStorageRoleParameters": {
      return {
        description: "Set Storage Role Params Proposal",
        category: "Storage",
        image,
        approvalQuorum: 66,
        approvalThreshold: 80,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "SetValidatorCount": {
      return {
        description: "Set Max Validator Count Proposal",
        category: "Validators",
        image,
        approvalQuorum: 66,
        approvalThreshold: 80,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "SetLead": {
      return {
        description: "Set Lead Proposal",
        category: "Content Working Group",
        image,
        approvalQuorum: 60,
        approvalThreshold: 75,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "SetContentWorkingGroupMintCapacity": {
      return {
        description: "Set WG Mint Capacity Proposal",
        category: "Content Working Group",
        image,
        approvalQuorum: 60,
        approvalThreshold: 75,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "Spending": {
      return {
        description: "Spending Proposal",
        category: "Other",
        image,
        approvalQuorum: 60,
        approvalThreshold: 80,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "SetElectionParameters": {
      return {
        description: "Set Election Parameters Proposal",
        category: "Council",
        image,
        approvalQuorum: 66,
        approvalThreshold: 80,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    case "RuntimeUpgrade": {
      return {
        description: "Runtime Upgrade Proposal",
        category: "Other",
        image,
        approvalQuorum: 80,
        approvalThreshold: 100,
        slashingQuorum: 60,
        slashingThreshold: 80,
      }
    }
    default: {
      throw new Error("'Proposal Type is invalid. Can't calculate metadata.");
    }
  }
}
