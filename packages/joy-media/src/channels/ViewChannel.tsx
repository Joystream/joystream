import React from 'react';
import { ChannelEntity } from '../entities/ChannelEntity';
import { ChannelId } from '@joystream/types/content-working-group';
import { VideoType } from '../schemas/video/Video';
import { MusicAlbumPreviewProps } from '../music/MusicAlbumPreview';
import { MusicTrackReaderPreviewProps } from '../music/MusicTrackReaderPreview';
import { ViewVideoChannel } from './ViewVideoChannel';
import { ViewMusicChannel } from './ViewMusicChannel';
import { toVideoPreviews } from '../video/VideoPreview';

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
    return <em>Channel is not found</em>;
  }

  if (channel.content === 'video') {
    const previews = toVideoPreviews(videos);
    return <ViewVideoChannel channel={channel} videos={previews} />;
  } else if (channel.content === 'music') {
    return <ViewMusicChannel channel={channel} albums={albums} tracks={tracks} />;
  } else {
    return <em>Unsupported channel type: {channel.content}</em>
  }
}
