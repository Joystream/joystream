import { AccountId } from '@polkadot/types/interfaces';
import { ChannelEntity } from "../entities/ChannelEntity";
import { ChannelType } from "../schemas/channel/Channel";
import { ChannelPublicationStatusAllValues } from "@joystream/types/content-working-group";

export const ChannelPublicationStatusDropdownOptions =
  ChannelPublicationStatusAllValues
    .map(x => ({ key: x, value: x, text: x }))

export const isVideoChannel = (channel: ChannelEntity) => {
  return channel.content === 'Video';
};

export const isMusicChannel = (channel: ChannelEntity) => {
  return channel.content === 'Music';
};

export const isAccountAChannelOwner = (channel?: ChannelEntity, account?: AccountId | string): boolean => {
  return (channel && account) ? channel.roleAccount.eq(account) : false
};

export function isPublicChannel(channel: ChannelType): boolean {
  return (
    channel.publicationStatus === 'Public' &&
    channel.curationStatus !== 'Censored'
  );
}

export function isCensoredChannel(channel: ChannelEntity) : boolean {
  return channel.curationStatus == 'Censored'
}

export function isVerifiedChannel(channel: ChannelEntity) : boolean {
  return channel.verified
}