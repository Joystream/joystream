import { ChannelEntity } from "../entities/ChannelEntity";
import { ChannelType } from "../schemas/channel/Channel";

export const isVideoChannel = (channel: ChannelEntity) => {
  return channel.content === 'video';
};

export const isMusicChannel = (channel: ChannelEntity) => {
  return channel.content === 'music';
};

// TODO use joy-types/content-working-group/index#PublicationStatusValue
const PublicationStatusValue = {
  Public: 'Public',
  Unlisted: 'Unlisted'
};

// TODO use joy-types/content-working-group/index#ChannelCurationStatus
const CurationStatusValue = {
  Normal: 'Normal',
  Censored: 'Censored'
};

export function isPublicChannel(channel: ChannelType): boolean {
  return (
    channel.verified === true &&
    channel.publicationStatus?.value === PublicationStatusValue.Public &&
    channel.curationStatus?.value !== CurationStatusValue.Censored
  );
}