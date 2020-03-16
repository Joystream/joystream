
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';
import moment from 'moment';
import { LanguageType } from '../general/Language';
import { MusicGenreType } from './MusicGenre';
import { MusicMoodType } from './MusicMood';
import { MusicThemeType } from './MusicTheme';
import { MediaObjectType } from '../general/MediaObject';
import { PublicationStatusType } from '../general/PublicationStatus';
import { CurationStatusType } from '../general/CurationStatus';
import { ContentLicenseType } from '../general/ContentLicense';
import { ChannelEntity } from '@polkadot/joy-media/entities/ChannelEntity';

export const MusicTrackValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  artist: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  thumbnail: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  description: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  firstReleased: Yup.string()
    .required('This field is required')
    .test('valid-date', 'Invalid date. Valid date formats are yyyy-mm-dd or yyyy-mm or yyyy.', (val?: any) => {
      return moment(val as any).isValid();
    }),
  composerOrSongwriter: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  lyrics: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type MusicTrackFormValues = {
  title: string
  artist: string
  thumbnail: string
  description: string
  language: number
  firstReleased: string
  genre: number
  mood: number
  theme: number
  link: string[]
  composerOrSongwriter: string
  lyrics: string
  object: number
  publicationStatus: number
  curationStatus: number
  explicit: boolean
  license: number
  attribution: string
  channelId: number
};

export type MusicTrackType = {
  classId: number
  inClassSchemaIndexes: number[]
  id: number
  title: string
  artist: string
  thumbnail: string
  description?: string
  language?: LanguageType
  firstReleased: number
  genre?: MusicGenreType
  mood?: MusicMoodType
  theme?: MusicThemeType
  link?: string[]
  composerOrSongwriter?: string
  lyrics?: string
  object?: MediaObjectType
  publicationStatus: PublicationStatusType
  curationStatus?: CurationStatusType
  explicit: boolean
  license: ContentLicenseType
  attribution?: string
  channelId?: number
  channel?: ChannelEntity
};

export class MusicTrackCodec extends EntityCodec<MusicTrackType> { }

export function MusicTrackToFormValues(entity?: MusicTrackType): MusicTrackFormValues {
  return {
    title: entity && entity.title || '',
    artist: entity && entity.artist || '',
    thumbnail: entity && entity.thumbnail || '',
    description: entity && entity.description || '',
    language: entity && entity.language?.id || 0,
    firstReleased: entity && moment(entity.firstReleased * 1000).format('YYYY-MM-DD') || '',
    genre: entity && entity.genre?.id || 0,
    mood: entity && entity.mood?.id || 0,
    theme: entity && entity.theme?.id || 0,
    link: entity && entity.link || [],
    composerOrSongwriter: entity && entity.composerOrSongwriter || '',
    lyrics: entity && entity.lyrics || '',
    object: entity && entity.object?.id || 0,
    publicationStatus: entity && entity.publicationStatus?.id || 0,
    curationStatus: entity && entity.curationStatus?.id || 0,
    explicit: entity && entity.explicit || false,
    license: entity && entity.license?.id || 0,
    attribution: entity && entity.attribution || '',
    channelId: entity && entity.channelId || 0
  }
}

export type MusicTrackPropId =
  'title' |
  'artist' |
  'thumbnail' |
  'description' |
  'language' |
  'firstReleased' |
  'genre' |
  'mood' |
  'theme' |
  'link' |
  'composerOrSongwriter' |
  'lyrics' |
  'object' |
  'publicationStatus' |
  'curationStatus' |
  'explicit' |
  'license' |
  'attribution' |
  'channelId'
  ;

export type MusicTrackGenericProp = {
  id: MusicTrackPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MusicTrackClassType = {
  [id in MusicTrackPropId]: MusicTrackGenericProp
};

export const MusicTrackClass: MusicTrackClassType = {
  title: {
    "id": "title",
    "name": "Title",
    "description": "The title of the track",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  artist: {
    "id": "artist",
    "name": "Artist",
    "description": "The artist, composer, band or group that published the track.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  thumbnail: {
    "id": "thumbnail",
    "name": "Thumbnail",
    "description": "URL to track cover art: NOTE: Should be an https link to a square image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Information about the track.",
    "type": "Text",
    "maxTextLength": 255
  },
  language: {
    "id": "language",
    "name": "Language",
    "description": "The language of the lyrics in the track.",
    "type": "Internal",
    "classId": "Language"
  },
  firstReleased: {
    "id": "firstReleased",
    "name": "First Released",
    "description": "When the track was first released",
    "required": true,
    "type": "Int64"
  },
  genre: {
    "id": "genre",
    "name": "Genre",
    "description": "The genre of the track.",
    "type": "Internal",
    "classId": "Music Genre"
  },
  mood: {
    "id": "mood",
    "name": "Mood",
    "description": "The mood of the track.",
    "type": "Internal",
    "classId": "Music Mood"
  },
  theme: {
    "id": "theme",
    "name": "Theme",
    "description": "The theme of the track.",
    "type": "Internal",
    "classId": "Music Theme"
  },
  link: {
    "id": "link",
    "name": "Link",
    "description": "A link to the artist page.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  composerOrSongwriter: {
    "id": "composerOrSongwriter",
    "name": "Composer or songwriter",
    "description": "The composer(s) and/or songwriter(s) of the track.",
    "type": "Text",
    "maxTextLength": 255
  },
  lyrics: {
    "id": "lyrics",
    "name": "Lyrics",
    "description": "Link to the track lyrics.",
    "type": "Text",
    "maxTextLength": 255
  },
  object: {
    "id": "object",
    "name": "Object",
    "description": "The entityId of the object in the data directory.",
    "type": "Internal",
    "classId": "Media Object"
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the track.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "id": "curationStatus",
    "name": "Curation Status",
    "description": "The publication status of the track set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "id": "explicit",
    "name": "Explicit",
    "description": "Indicates whether the track contains explicit material.",
    "required": true,
    "type": "Bool"
  },
  license: {
    "id": "license",
    "name": "License",
    "description": "The license of which the track is released under.",
    "required": true,
    "type": "Internal",
    "classId": "Content License"
  },
  attribution: {
    "id": "attribution",
    "name": "Attribution",
    "description": "If the License requires attribution, add this here.",
    "type": "Text",
    "maxTextLength": 255
  },
  channelId: {
    "id": "channelId",
    "name": "Channel Id",
    "description": "Id of the channel this music track is published to.",
    "type": "Uint64"
  }
};
