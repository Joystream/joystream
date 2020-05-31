import { AccountId } from '@polkadot/types/interfaces';
import { ChannelType } from "../schemas/channel/Channel";
import { ChannelPublicationStatusAllValues } from "@joystream/types/content-working-group";

export const ChannelPublicationStatusDropdownOptions =
  ChannelPublicationStatusAllValues
    .map(x => ({ key: x, value: x, text: x }))

export const isVideoChannel = (channel: ChannelType) => {
  return channel.content === 'Video';
};

export const isMusicChannel = (channel: ChannelType) => {
  return channel.content === 'Music';
};

export const isAccountAChannelOwner = (channel?: ChannelType, account?: AccountId | string): boolean => {
  return (channel && account) ? channel.roleAccount.eq(account) : false
};

export function isPublicChannel(channel: ChannelType): boolean {
  return (
    channel.publicationStatus === 'Public' &&
    channel.curationStatus !== 'Censored'
  );
}

export function isCensoredChannel(channel: ChannelType): boolean {
  return channel.curationStatus == 'Censored'
}

export function isVerifiedChannel(channel: ChannelType): boolean {
  return channel.verified
}
