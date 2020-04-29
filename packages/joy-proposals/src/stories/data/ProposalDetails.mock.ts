import { ParsedProposal } from "@polkadot/joy-proposals/runtime";

const mockedProposal: Partial<ParsedProposal> = {
  title: "Send me some tokens for coffee",
  description:
    "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",
  proposer: {
    name: "Satoshi",
    avatar_uri: "https://react.semantic-ui.com/images/avatar/large/steve.jpg"
  },
  type: "SpendingProposal",
  createdAtBlock: 6554,
  details: ["1200tJOY", "5hbcehbehbehifbrjjwodk"],

  status: "Active",
  createdAt: new Date("Mar 25, 2020 at 14:20")
};

export default mockedProposal;
