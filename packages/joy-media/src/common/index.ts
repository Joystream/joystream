import { ChannelEntity } from "../entities/ChannelEntity";

export const datePlaceholder = 'Date in format yyyy-mm-dd';

export const isVideoChannel = (channel: ChannelEntity) => {
  return channel.content === 'video';
};

export const isMusicChannel = (channel: ChannelEntity) => {
  return channel.content === 'music';
};
