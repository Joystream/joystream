import React, { useState } from 'react';
import { Button, CheckboxProps, Dropdown, Modal, Message } from 'semantic-ui-react';

import { Pluralize } from '@polkadot/joy-utils/Pluralize';
import Section from '@polkadot/joy-utils/Section';
import { MusicAlbumPreviewProps } from './MyMusicAlbums';
import { MusicTrackPreviewProps, MusicTrackPreview } from './MusicTrackPreview';
import { ReorderTracksInAlbum } from './ReorderTracksInAlbum';

export type MyMusicTracksProps = {
  albums?: MusicAlbumPreviewProps[],
  tracks?: MusicTrackPreviewProps[]
};

export function MyMusicTracks (props: MyMusicTracksProps) {
  const [idxsOfSelectedTracks, setIdxsOfSelectedTracks] = useState(new Set<number>());

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

  const { albums = [], tracks = [] } = props;
  const albumsCount = albums.length;
  const tracksCount = tracks.length;
  const selectedCount = idxsOfSelectedTracks.size;

  let longestAlbumName = '';
  albums.forEach(x => {
    if (longestAlbumName.length < x.title.length) {
      longestAlbumName = x.title;
    }
  });

  const albumsDropdownOptions = albums.map(x => {
    const id = x.title; // TODO replace with unique id of album
    return {
      key: id,
      value: id,
      text: x.title,
      image: x.cover
    };
  });

  const [showSecondScreen, setShowSecondScreen] = useState(false);
  const [albumName, setAlbumName] = useState<string | undefined>();

  const AlbumDropdown = () => {
    const style = {
      display: 'inline-block',
      opacity: selectedCount ? 1 : 0,

      // This is a required hack to fit every dropdown items on a single line:
      minWidth: `${longestAlbumName.length / 1.5}rem`
    }
    
    return <div style={style}>
      <Dropdown
        onChange={(_e, { value }) => {
          setAlbumName(value as string);
          setShowSecondScreen(true);
        }}
        options={albumsDropdownOptions}
        placeholder='Select an album'
        search
        selection
        value={albumName}
      />
    </div>;
  }

  const AddTracksText = () => albumsCount
    ? <span style={{ marginRight: '1rem' }}>
        Add <Pluralize count={selectedCount} singularText='track' /> to
      </span>
    : <em>
        You have no albums.
        <Button content='Create first album' icon='plus' />
      </em>

  const goBack = () => {
    setAlbumName('');
    setShowSecondScreen(false);
  }

  const renderAllTracks = () => {
    return <Section title={`My Music Tracks (${tracksCount})`}>

      <div className='JoyTopActionBar'>
        {selectedCount
          ? <><AddTracksText /></>
          : <span>Select tracks to add them to your album</span>
        }
        <AlbumDropdown />
      </div>

      <div className='JoyListOfPreviews'>
        {tracksCount === 0
          ? <em className='NoItems'>You have no music tracks yet</em>
          : tracks.map((track, i) =>
              <MusicTrackPreview
                key={i}
                {...track}
                position={i + 1}
                selected={idxsOfSelectedTracks.has(i)}
                onSelect={(e, d) => onTrackSelect(i, e, d)}
                withEditButton
              />
            )
        }
      </div>
    </Section>;
  }

  const renderReorderTracks = () => {
    return <Section title={`Add tracks to album "${albumName}"`}>

      <Message
        info
        icon='info'
        content='You can reorder tracks before adding them to this album.'
      />

      <ReorderTracksInAlbum tracks={tracks.filter((_track, i) => idxsOfSelectedTracks.has(i))} />

      <div style={{ marginTop: '1rem' }}>
        <Button size='large' onClick={goBack}>&lt; Back to my tracks</Button>
        <Button size='large' primary style={{ float: 'right' }} onClick={goBack}>Add to album &gt;</Button>
      </div>
    </Section>;
  }

  return <div className='JoyPaperWidth'>{
    !showSecondScreen
      ? renderAllTracks()
      : renderReorderTracks()
    }</div>;
}
