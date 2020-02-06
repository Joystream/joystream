import { ChannelEntity } from "../entities/ChannelEntity";

export const isVideoChannel = (channel: ChannelEntity) => {
  return channel.content === 'video';
};

export const isMusicChannel = (channel: ChannelEntity) => {
  return channel.content === 'music';
};
