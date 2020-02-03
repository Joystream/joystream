import { ChannelEntity } from "@polkadot/joy-media/entities/ChannelEntity";

import { AccountIdSamples } from "./AccountIdSamples";
import BN from 'bn.js';

let id = 0;
const nextId = () => ++id;

export const ChannelDataSample: ChannelEntity = {
	id: nextId(),

	revenueAccountId: AccountIdSamples.Alice,
	rewardEarned: new BN('4587'),
	contentItemsCount: 57,
	visibility: 'Public',
	blocked: false,

	content: 'music',
	handle: 'easy_notes',
	title: 'Easy Notes',
	description: 'A fortepiano is an early piano. In principle, the word "fortepiano" can designate any piano dating from the invention of the instrument by Bartolomeo Cristofori around 1700 up to the early 19th century. Most typically, however, it is used to refer to the late-18th to early-19th century instruments for which Haydn, Mozart, and the younger Beethoven wrote their piano music.',

	avatar: 'https://images.unsplash.com/photo-1485561222814-e6c50477491b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
	banner: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=80'
};

export const ChannelsDataSamples: ChannelEntity[] = [
	ChannelDataSample,
	{
		id: nextId(),
		
		revenueAccountId: AccountIdSamples.Bob,
		rewardEarned: new BN('1820021'),
		contentItemsCount: 1529,
		visibility: 'Unlisted',
		blocked: true,

		content: 'video',
		handle: 'bicycles_rocknroll',
		title: 'Bicycles and Rock-n-Roll',
		description: 'A bicycle, also called a cycle or bike, is a human-powered or motor-powered, pedal-driven, single-track vehicle, having two wheels attached to a frame, one behind the other. A is called a cyclist, or bicyclist.',

		avatar: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
		banner: 'https://images.unsplash.com/photo-1494488802316-82250d81cfcc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=60'
	}
];
