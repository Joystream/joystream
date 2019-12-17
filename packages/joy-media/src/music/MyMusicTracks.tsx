import React, { useState } from 'react';
import { Button, CheckboxProps, Dropdown, Message } from 'semantic-ui-react';

import { Pluralize } from '@polkadot/joy-utils/Pluralize';
import Section from '@polkadot/joy-utils/Section';
import { EditableMusicTrackPreviewProps, MusicTrackPreview } from './MusicTrackPreview';
import { ReorderableTracks } from './ReorderableTracks';
import { MusicAlbumPreviewProps } from './MusicAlbumPreview';

export type MyMusicTracksProps = {
  albums?: MusicAlbumPreviewProps[],
  tracks?: EditableMusicTrackPreviewProps[]
};

export function MyMusicTracks (props: MyMusicTracksProps) {
  const [idsOfSelectedTracks, setIdsOfSelectedTracks] = useState(new Set<string>());

  const onTrackSelect = (
    track: EditableMusicTrackPreviewProps,
    _event: React.FormEvent<HTMLInputElement>,
    data: CheckboxProps
  ) => {
    const { id } = track;
    const set = new Set(idsOfSelectedTracks);

    data.checked
      ? set.add(id)
      : set.delete(id)
    ;
    setIdsOfSelectedTracks(set);
  }

  const { albums = [], tracks = [] } = props;
  const albumsCount = albums.length;
  const tracksCount = tracks.length;
  const selectedCount = idsOfSelectedTracks.size;

  let longestAlbumName = '';
  albums.forEach(x => {
    if (longestAlbumName.length < x.title.length) {
      longestAlbumName = x.title;
    }
  });

  const albumsDropdownOptions = albums.map(x => {
    const { id } = x;
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
        onChange={(_e, { value: id }) => {
          const selectedAlbum = albums.find(x => x.id === id);
          if (selectedAlbum) {
            setAlbumName(selectedAlbum.title);
            setShowSecondScreen(true);
          }
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
                selected={idsOfSelectedTracks.has(track.id)}
                onSelect={(e, d) => onTrackSelect(track, e, d)}
                withEditButton
              />
            )
        }
      </div>
    </Section>;
  }

  const selectedTracks = tracks.filter(track => idsOfSelectedTracks.has(track.id))

  const renderReorderTracks = () => {
    return <Section title={`Add tracks to album "${albumName}"`}>

      <Message
        info
        icon='info'
        content='You can reorder tracks before adding them to this album.'
      />

      <ReorderableTracks
        tracks={selectedTracks}
        onRemove={track => {
          const set = new Set(idsOfSelectedTracks);
          set.delete(track.id);
          setIdsOfSelectedTracks(set);
        }}
      />

      <div style={{ marginTop: '1rem' }}>
        <Button size='large' onClick={goBack}>&lt; Back to my tracks</Button>
        <Button size='large' primary style={{ float: 'right' }} onClick={() => alert('Not implemented yet')}>Add to album &gt;</Button>
      </div>
    </Section>;
  }

  return <div className='JoyPaperWidth'>{
    !showSecondScreen
      ? renderAllTracks()
      : renderReorderTracks()
    }</div>;
}
