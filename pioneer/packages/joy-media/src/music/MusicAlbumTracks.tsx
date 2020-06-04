import React, { useState } from 'react';
import { Button, CheckboxProps } from 'semantic-ui-react';
import { Pluralize } from '@polkadot/joy-utils/Pluralize';
import { EditableMusicTrackPreviewProps, MusicTrackPreview } from './MusicTrackPreview';
import { MusicAlbumPreviewProps, MusicAlbumPreview } from './MusicAlbumPreview';

export type TracksOfMyMusicAlbumProps = {
  album: MusicAlbumPreviewProps;
  tracks?: EditableMusicTrackPreviewProps[];
};

export function TracksOfMyMusicAlbum (props: TracksOfMyMusicAlbumProps) {
  const [idxsOfSelectedTracks, setIdxsOfSelectedTracks] = useState(new Set<number>());

  const { album, tracks = [] } = props;
  const tracksCount = (tracks && tracks.length) || 0;

  const onTrackSelect = (
    trackIdx: number,
    _event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) => {
    const set = new Set(idxsOfSelectedTracks);
    data.checked
      ? set.add(trackIdx)
      : set.delete(trackIdx)
    ;
    setIdxsOfSelectedTracks(set);
  };

  const selectedCount = idxsOfSelectedTracks.size;

  const removeButtonText = <span>Remove <Pluralize count={selectedCount} singularText='track' /> from album</span>;

  return <>
    <MusicAlbumPreview {...album} tracksCount={tracksCount} />

    <div className='JoyTopActionBar'>
      <Button content='Add track' icon='plus' />
      {selectedCount > 0 && <Button content={removeButtonText} icon='trash' />}
    </div>

    <div className='JoyListOfPreviews'>
      {tracksCount === 0
        ? <em className='NoItems'>This album has no tracks yet</em>
        : tracks.map((track, i) =>
          <MusicTrackPreview
            key={i}
            {...track}
            position={i + 1}
            onSelect={(e, d) => onTrackSelect(i, e, d)}
            withRemoveButton
          />
        )
      }
    </div>
  </>;
}
