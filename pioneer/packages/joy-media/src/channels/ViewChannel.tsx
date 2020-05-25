import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelId } from '@joystream/types/lib/content-working-group';
import { VideoType } from '../schemas/video/Video';
import { MusicAlbumPreviewProps } from '../music/MusicAlbumPreview';
import { MusicTrackReaderPreviewProps } from '../music/MusicTrackReaderPreview';
import { ViewVideoChannel } from './ViewVideoChannel';
import { ViewMusicChannel } from './ViewMusicChannel';
import { toVideoPreviews } from '../video/VideoPreview';
import { isVideoChannel, isMusicChannel } from './ChannelHelpers';
import { JoyError } from '@polkadot/joy-utils/JoyStatus';

export type ViewChannelProps = {
  id: ChannelId,
  channel?: ChannelEntity,

  // Video channel specific:
  videos?: VideoType[],

  // Music channel specific:
  albums?: MusicAlbumPreviewProps[],
  tracks?: MusicTrackReaderPreviewProps[]
}

export function ViewChannel (props: ViewChannelProps) {
  const { channel, videos = [], albums = [], tracks = [] } = props;

  if (!channel) {
    return <JoyError title={`Channel was not found`} />
  }

  if (isVideoChannel(channel)) {
    const previews = toVideoPreviews(videos);
    return <ViewVideoChannel channel={channel} videos={previews} />;
  } else if (isMusicChannel(channel)) {
    return <ViewMusicChannel channel={channel} albums={albums} tracks={tracks} />;
  } else {
    return <JoyError title={`Unsupported channel type`}>{channel.content}</JoyError>
  }
}
