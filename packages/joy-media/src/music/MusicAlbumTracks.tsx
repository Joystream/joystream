import React, { useState } from 'react';
import { Button, Checkbox, CheckboxProps } from 'semantic-ui-react';

import { MusicAlbumPreviewProps, MusicAlbumPreview } from './MyMusicAlbums';
import { Pluralize } from '@polkadot/joy-utils/Pluralize';

type OnCheckboxChange = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => void;

export type MusicTrackPreviewProps = {
  title: string,
  artist: string,
  cover: string,
  position?: number,
  onSelect?: OnCheckboxChange,
  isDraggable?: boolean,
  withEditButton?: boolean,
  withRemoveButton?: boolean,
  withActionLabels?: boolean
};

export function MusicTrackPreview (props: MusicTrackPreviewProps) {
  const { withActionLabels = false } = props;
  const [checked, setChecked] = useState(false);

  const onChange: OnCheckboxChange = (e, d) => {
    try {
      props.onSelect && props.onSelect(e, d);
    } catch (err) {
      console.log('Error during checkbox change:', err);
    }
    setChecked(d.checked || false);
  }

  return <div className={`JoyMusicTrackPreview ${checked && `SelectedItem`} ${props.isDraggable && `DraggableItem`}`}>
    {props.onSelect && <div className='CheckboxCell'>
      <Checkbox checked={checked} onChange={onChange} />
    </div>}
    {props.position && <div className='AlbumNumber'>{props.position}</div>}
    <div className='AlbumCover'>
      <img src={props.cover} />
    </div>
    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
    </div>
    <div className='AlbumActions'>
      {props.withEditButton && <Button icon='pencil' content={withActionLabels ? 'Edit' : null} />}
      {props.withRemoveButton && <Button icon='trash' content={withActionLabels ? 'Remove from album' : null} />}
    </div>
  </div>;
}

export type TracksOfMyMusicAlbumProps = {
  album: MusicAlbumPreviewProps,
  tracks?: MusicTrackPreviewProps[]
};

export function TracksOfMyMusicAlbum (props: TracksOfMyMusicAlbumProps) {
  const [idxsOfSelectedTracks, setIdxsOfSelectedTracks] = useState(new Set<number>());

  const { album, tracks = [] } = props;
  const tracksCount = tracks && tracks.length || 0;

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
  }

  const selectedCount = idxsOfSelectedTracks.size;

  const removeButtonText = <span>Remove <Pluralize count={selectedCount} singularText='track' /> from album</span>

  return <>
    <MusicAlbumPreview {...album} tracksCount={tracksCount} />

    <div className='JoyMusicAlbumActionBar'>
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
