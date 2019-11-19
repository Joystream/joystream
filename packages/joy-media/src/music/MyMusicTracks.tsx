import React, { useState } from 'react';
import { Button, CheckboxProps, Dropdown, Modal } from 'semantic-ui-react';

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

  const albumsDropdownOptions = albums.map(x => {
    const id = x.title; // TODO replace with unique id of album
    return {
      key: id,
      value: id,
      text: x.title,
      image: x.cover
    };
  });

  const [showModal, setShowModal] = useState(false);
  const [albumName, setAlbumName] = useState<string | undefined>();
  const [albumQuery, setAlbumQuery] = useState<string | undefined>('');

  const AlbumDropdown = () => (
    <Dropdown
      onChange={(_e, { searchQuery, value }) => {
        setAlbumQuery(searchQuery);
        setAlbumName(value as string);
        setShowModal(true);
      }}
      onSearchChange={(_e, { searchQuery }) => {
        setAlbumQuery(searchQuery);
      }}
      options={albumsDropdownOptions}
      placeholder='Select an album'
      search
      searchQuery={albumQuery}
      selection
      value={albumName}
    />
  )

  const AddTracksText = () => albumsCount > 0
    ? <span>Add <Pluralize count={selectedCount} singularText='track' /> to your album</span>
    : <em>You have no albums. <Button content='Create first album' icon='plus' /></em>

  return <Section title={`My Tracks (${tracksCount})`}>

    <Modal
      centered={false}
      open={showModal}
      onClose={() => setShowModal(false)}
    >
      <Modal.Header>Add tracks to album {albumName}</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
          <ReorderTracksInAlbum tracks={tracks.filter((_track, i) => idxsOfSelectedTracks.has(i))} />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setShowModal(false)}>Cancel</Button>
        <Button primary onClick={() => setShowModal(false)}>Add to album</Button>
      </Modal.Actions>
    </Modal>

    <div className='JoyTopActionBar'>
      {selectedCount > 0
        ? <><AddTracksText /><AlbumDropdown /></>
        : <span>Select tracks to add them to an album</span>
      }
    </div>

    <div className='JoyListOfPreviews'>
      {tracksCount === 0
        ? <em className='NoItems'>You have no music tracks yet</em>
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
  </Section>;
}
