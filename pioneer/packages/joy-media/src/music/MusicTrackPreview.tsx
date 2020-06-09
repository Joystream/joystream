import React, { useState } from 'react';
import { Button, Checkbox, CheckboxProps } from 'semantic-ui-react';

type OnCheckboxChange = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => void;

export type EditableMusicTrackPreviewProps = {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  position?: number;
  selected?: boolean;
  onSelect?: OnCheckboxChange;
  onEdit?: () => void;
  onRemove?: () => void;
  withEditButton?: boolean;
  withRemoveButton?: boolean;
  withActionLabels?: boolean;
  isDraggable?: boolean;
};

export function MusicTrackPreview (props: EditableMusicTrackPreviewProps) {
  const {
    withActionLabels = false,
    selected = false,
    onEdit = () => { /* do nothing */ },
    onRemove = () => { /* do nothing */ }
  } = props;

  const [checked, setChecked] = useState(selected);

  const onChange: OnCheckboxChange = (e, d) => {
    try {
      props.onSelect && props.onSelect(e, d);
    } catch (err) {
      console.log('Error during checkbox change:', err);
    }
    setChecked(d.checked || false);
  };

  return <div className={`JoyMusicTrackPreview ${checked && 'SelectedItem'} ${props.isDraggable && 'DraggableItem'}`}>
    {props.onSelect && <div className='CheckboxCell'>
      <Checkbox checked={checked} onChange={onChange} />
    </div>}
    {props.position && <div className='AlbumNumber'>{props.position}</div>}
    <div className='AlbumCover'>
      <img src={props.thumbnail} />
    </div>
    <div className='AlbumDescription'>
      <h3 className='AlbumTitle'>{props.title}</h3>
      <div className='AlbumArtist'>{props.artist}</div>
    </div>
    <div className='AlbumActions'>
      {props.withEditButton && <Button icon='pencil' content={withActionLabels ? 'Edit' : null} onClick={onEdit} />}
      {props.withRemoveButton && <Button icon='trash' content={withActionLabels ? 'Remove' : null} onClick={onRemove} />}
    </div>
  </div>;
}
