import { ProposalTypePreviewProps } from '@polkadot/joy-proposals/ProposalTypePreview'

const mockDesc = `
	Change the total reward across all validators in a given block.\n
	This is not the direct reward, but base reward for Pallet staking module.
`

export const MockProposalTypes: ProposalTypePreviewProps[] = [
	{
		name: 'Text/signal Proposal',
		description: mockDesc,
		requiredStake: 10,
		cancellationFee: undefined,
		gracePeriod: 15
	},
	{
		name: 'Evict Storage Provider',
		description: mockDesc,
		requiredStake: 25,
		cancellationFee: 20,
		gracePeriod: 15
	},
	{
		name: 'Set Storage Role Params',
		description: mockDesc,
		requiredStake: 45,
		cancellationFee: 30,
		gracePeriod: 50
	},
	{
		name: 'Set Max Validator Count',
		description: mockDesc,
		requiredStake: 25,
		cancellationFee: 20,
		gracePeriod: 15
	},
	{
		name: 'Set Lead',
		description: mockDesc,
		requiredStake: 50,
		cancellationFee: undefined,
		gracePeriod: 25
	},
	{
		name: 'Set Working Group Mint Capacity',
		description: mockDesc,
		requiredStake: 150,
		cancellationFee: 125,
		gracePeriod: 100
	},
	{
		name: 'Set Council Module Mint Capacity',
		description: mockDesc,
		requiredStake: 220,
		cancellationFee: 150,
		gracePeriod: 100
	},
	{
		name: 'Set Council Parameters',
		description: mockDesc,
		requiredStake: 125,
		cancellationFee: undefined,
		gracePeriod: 50
	},
	{
		name: 'Upgrade Runtime',
		description: mockDesc,
		requiredStake: 777,
		cancellationFee: 666,
		gracePeriod: 200
	},
	{
		name: 'Spending Proposal',
		description: mockDesc,
		requiredStake: 75,
		cancellationFee: 10,
		gracePeriod: 100
	}
]
