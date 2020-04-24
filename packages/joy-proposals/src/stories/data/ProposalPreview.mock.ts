import { ProposalProps } from "../../Proposal/ProposalDetails";

const mockedProposalPreview: Partial<ProposalProps> = {
  title: "Send me some tokens for coffee",
  description:
    "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",

  details: {
    createdBy: {
      name: "Satoshi",
      avatar: "https://react.semantic-ui.com/images/avatar/large/steve.jpg"
    },
    stage: "Active",
    substage: "Active",
    createdAt: "Mar 25, 2020 at 14:20",
    type: "Spending Proposal",
    expiresIn: 5678
  }
};

export default mockedProposalPreview;
