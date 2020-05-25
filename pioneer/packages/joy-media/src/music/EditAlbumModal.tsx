import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { TracksOfMyMusicAlbumProps, TracksOfMyMusicAlbum } from './MusicAlbumTracks';

export const EditAlbumModal = (props: TracksOfMyMusicAlbumProps) => {
  return <Modal trigger={<Button icon='pencil'>Edit album</Button>} centered={false}>
    <Modal.Header>Edit My Album</Modal.Header>
    <Modal.Content image>
      <Modal.Description>
        <TracksOfMyMusicAlbum {...props} />
      </Modal.Description>
    </Modal.Content>
  </Modal>
}