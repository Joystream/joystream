import { ProposalTypeInfo } from "../../Proposal/ProposalTypePreview";
import { Categories } from "../../Proposal/ChooseProposalType";

const MockProposalTypesInfo: ProposalTypeInfo[] = [
  {
    type: "Text",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 5,
    cancellationFee: 0,
    gracePeriod: 0,
    votingPeriod: 10000,
  },
  {
    type: "Spending",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 10,
    cancellationFee: 5,
    gracePeriod: 3,
    votingPeriod: 10000,
  },
  {
    type: "RuntimeUpgrade",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 14,
    votingPeriod: 10000,
  },
  {
    type: "EvictStorageProvider",
    category: Categories.storage,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 1,
    votingPeriod: 10000,
  },
  {
    type: "SetStorageRoleParameters",
    category: Categories.storage,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 500,
    cancellationFee: 60,
    gracePeriod: 14,
    votingPeriod: 10000,
  },
  {
    type: "SetValidatorCount",
    category: Categories.validators,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 45,
    cancellationFee: 10,
    gracePeriod: 5,
    votingPeriod: 10000,
  },
  {
    type: "SetContentWorkingGroupMintCapacity",
    category: Categories.cwg,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 90,
    cancellationFee: 8,
    gracePeriod: 5,
    votingPeriod: 10000,
  },
  {
    type: "SetLead",
    category: Categories.cwg,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 500,
    cancellationFee: 50,
    gracePeriod: 7,
    votingPeriod: 10000,
  },
  {
    type: "SetElectionParameters",
    category: Categories.council,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 1000,
    cancellationFee: 100,
    gracePeriod: 30,
    votingPeriod: 10000,
  },
];

export default MockProposalTypesInfo;
