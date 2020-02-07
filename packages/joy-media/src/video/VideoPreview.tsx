import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { BgImg } from '../common/BgImg';
import { VideoType } from '../schemas/video/Video';

export type VideoPreviewProps = {
  id: number,
  title: string,
  thumbnail: string,

  // Preview-specific props:
  size?: 'normal' | 'small',
  orientation?: 'vertical' | 'horizontal',
};

export function VideoPreview (props: VideoPreviewProps) {
  const { id, size = 'normal', orientation = 'vertical' } = props;

  let width: number = 210;
  let height: number = 118;

  if (size === 'small') {
    width = 168;
    height = 94;
  }
  
  let descStyle: CSSProperties = {
    maxWidth: orientation === 'vertical'
      ? width
      : width * 1.5
  };

  // TODO Do real check if current use is an owner of this entity:
  const iAmOwner = true;
  
  const viewUrl = `/media/video/${id}`;

  return (
    <div className={`JoyMusicAlbumPreview ` + orientation}>

      <Link to={viewUrl}>
        <BgImg
          url={props.thumbnail}
          className='AlbumCover'
          width={width}
          height={height}
        />
      </Link>
      
      <div className='AlbumDescription' style={descStyle}>

        <Link to={viewUrl}>
          <h3 className='AlbumTitle'>{props.title}</h3>
        </Link>

        {iAmOwner &&
          <div>
            <Link to={`/media/video/${id}/edit`} className='ui button basic small'>
              <i className='icon pencil' />
              Edit
            </Link>
          </div>
        }
      </div>
    </div>
  );
}

export function toVideoPreviews(items: VideoType[]): VideoPreviewProps[] {
  return items.map(x => ({
    id: x.id,
    title: x.title,
    thumbnail: x.thumbnail,
  }));
}
