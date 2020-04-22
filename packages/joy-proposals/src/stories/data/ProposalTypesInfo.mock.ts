import { ProposalTypeInfo } from "../../Proposal/ProposalTypePreview";
import { Categories } from "../../Proposal/ChooseProposalType";

const MockProposalTypesInfo: ProposalTypeInfo[] = [
  {
    type: "Signal Proposal",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 5,
    cancellationFee: 0,
    gracePeriod: 0,
  },
  {
    type: "Spending Proposal",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 10,
    cancellationFee: 5,
    gracePeriod: 3,
  },
  {
    type: "Runtime Upgrade",
    category: Categories.other,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 14,
  },
  {
    type: "Evict Storage Provider",
    category: Categories.storage,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 1,
  },
  {
    type: "Set Storage Provider Parameters",
    category: Categories.storage,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 500,
    cancellationFee: 60,
    gracePeriod: 14,
  },
  {
    type: "Set Validator Count",
    category: Categories.validators,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 45,
    cancellationFee: 10,
    gracePeriod: 5,
  },
  {
    type: "Change Content Working Group Mint Capacity",
    category: Categories.cwg,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 90,
    cancellationFee: 8,
    gracePeriod: 5,
  },
  {
    type: "Set Content Working Group Lead",
    category: Categories.cwg,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 500,
    cancellationFee: 50,
    gracePeriod: 7,
  },
  {
    type: "Set Council Parameters",
    category: Categories.council,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 1000,
    cancellationFee: 100,
    gracePeriod: 30,
  },
  {
    type: "Change Council Mint Capacity",
    category: Categories.council,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 7,
  },
];

export default MockProposalTypesInfo;
