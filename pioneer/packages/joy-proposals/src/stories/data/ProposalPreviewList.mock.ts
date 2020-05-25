import mockedProposal from "./ProposalDetails.mock";

// const MockProposalPreviewList: ParsedProposal[] = [
//   {
//     title: "Send me some tokens for coffee",
//     description:
//       "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",
//     finalized: "approved",
//     details: {
//       createdBy: {
//         name: "Satoshi",
//         avatar: "https://react.semantic-ui.com/images/avatar/large/steve.jpg"
//       },
//       stage: "Finalized",
//       substage: "Grace Period",
//       createdAt: "Mar 25, 2020 at 14:20",
//       type: "Spending Proposal",
//       expiresIn: 5678
//     }
//   },
//   {
//     title: "Send me some tokens for coffee",
//     description:
//       "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",

//     finalized: "slashed",
//     details: {
//       createdBy: {
//         name: "David Douglas",
//         avatar: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg"
//       },
//       stage: "Active",
//       substage: "Grace Period",
//       createdAt: "Mar 25, 2020 at 14:20",
//       type: "Spending Proposal",
//       expiresIn: 5678
//     }
//   },
//   {
//     title: "Send me some tokens for coffee",
//     description:
//       "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",

//     finalized: "approved",
//     details: {
//       createdBy: {
//         name: "David Douglas",
//         avatar: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg"
//       },
//       stage: "Active",
//       substage: "Grace Period",
//       createdAt: "Mar 25, 2020 at 14:20",
//       type: "Spending Proposal",
//       expiresIn: 5678
//     }
//   },
//   {
//     title: "Send me some tokens for coffee",
//     description:
//       "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",

//     finalized: "approved",
//     details: {
//       createdBy: {
//         name: "David Douglas",
//         avatar: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg"
//       },
//       stage: "Active",
//       substage: "Grace Period",
//       createdAt: "Mar 25, 2020 at 14:20",
//       type: "Spending Proposal",
//       expiresIn: 5678
//     }
//   },
//   {
//     title: "Send me some tokens for coffee",
//     description:
//       "Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.",

//     finalized: "withdrawn",
//     details: {
//       createdBy: {
//         name: "David Douglas",
//         avatar: "https://react.semantic-ui.com/images/avatar/large/elliot.jpg"
//       },
//       stage: "Active",
//       substage: "Grace Period",
//       createdAt: "Mar 25, 2020 at 14:20",
//       type: "Spending Proposal",
//       expiresIn: 5678
//     }
//   }
// ];
const MockProposalPreviewList = Array.from({ length: 5 }, (_, i) => mockedProposal);
export default MockProposalPreviewList;
