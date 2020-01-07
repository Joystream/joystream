
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';
import { VideoType } from '../video/Video';
import { MusicAlbumType } from '../music/MusicAlbum';

export const FeaturedContentValidationSchema = Yup.object().shape({
  // No validation rules.
});

export type FeaturedContentFormValues = {
  topVideo: string
  featuredVideos: string
  featuredAlbums: string
};

export type FeaturedContentType = {
  topVideo?: VideoType
  featuredVideos?: VideoType[]
  featuredAlbums?: MusicAlbumType[]
};

export const FeaturedContentCodec = new EntityCodec<FeaturedContentType>();

export type FeaturedContentPropId =
  'topVideo' |
  'featuredVideos' |
  'featuredAlbums'
  ;

export type FeaturedContentGenericProp = {
  id: FeaturedContentPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type FeaturedContentClassType = {
  [id in FeaturedContentPropId]: FeaturedContentGenericProp
};

export const FeaturedContentClass: FeaturedContentClassType = {
  topVideo: {
    "id": "topVideo",
    "name": "Top Video",
    "description": "The video that has the most prominent position(s) on the platform.",
    "type": "Internal",
    "classId": "Video"
  },
  featuredVideos: {
    "id": "featuredVideos",
    "name": "Featured Videos",
    "description": "Videos featured in the Video tab.",
    "type": "InternalVec",
    "maxItems": 6,
    "classId": "Video"
  },
  featuredAlbums: {
    "id": "featuredAlbums",
    "name": "Featured Albums",
    "description": "Music albums featured in the Music tab.",
    "type": "InternalVec",
    "maxItems": 6,
    "classId": "Music Album"
  }
};
