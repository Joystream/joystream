import { ProposalTypeInfo } from "../../Proposal/ProposalTypePreview";
import { Categories } from "../../Proposal/ChooseProposalType";

const MockProposalTypesInfo: ProposalTypeInfo[] = [
  {
    type: "Update Validator Reward",
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
    type: "Change Storage Provider Count",
    category: Categories.storage,
    image: "https://react.semantic-ui.com/images/wireframe/image.png",
    description:
        "Change the total reward across all validators in a given block."+
        "This is not the direct reward, but base reward for Pallet staking module."+
        "The minimum value must be greater than 450 tJOY based on current runtime.",
    stake: 5,
    cancellationFee: 0,
    gracePeriod: 1,
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
