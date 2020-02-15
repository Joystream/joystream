import { ChannelEntity } from "../entities/ChannelEntity";
import { ChannelType } from "../schemas/channel/Channel";

export const isVideoChannel = (channel: ChannelEntity) => {
  return channel.content === 'Video';
};

export const isMusicChannel = (channel: ChannelEntity) => {
  return channel.content === 'Music';
};

export function isPublicChannel(channel: ChannelType): boolean {
  return (
    channel.verified === true && // TODO uncomment
    channel.publicationStatus === 'Public' &&
    channel.curationStatus !== 'Censored'
  );
}