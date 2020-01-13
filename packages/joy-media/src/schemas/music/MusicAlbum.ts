
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';
import { MusicGenreType } from './MusicGenre';
import { MusicMoodType } from './MusicMood';
import { MusicThemeType } from './MusicTheme';
import { MusicTrackType } from './MusicTrack';
import { LanguageType } from '../general/Language';
import { PublicationStatusType } from '../general/PublicationStatus';
import { CurationStatusType } from '../general/CurationStatus';
import { ContentLicenseType } from '../general/ContentLicense';

export const MusicAlbumValidationSchema = Yup.object().shape({
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
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  lyrics: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  composerOrSongwriter: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type MusicAlbumFormValues = {
  title: string
  artist: string
  thumbnail: string
  description: string
  firstReleased: number
  genre: number
  mood: number
  theme: number
  tracks: number[]
  language: number
  link: string[]
  lyrics: string
  composerOrSongwriter: string
  reviews: string[]
  publicationStatus: number
  curationStatus: number
  explicit: boolean
  license: number
  attribution: string
};

export type MusicAlbumType = {
  id: number
  title: string
  artist: string
  thumbnail: string
  description: string
  firstReleased: number
  genre?: MusicGenreType
  mood?: MusicMoodType
  theme?: MusicThemeType
  tracks?: MusicTrackType[]
  language?: LanguageType
  link?: string[]
  lyrics?: string
  composerOrSongwriter?: string
  reviews?: string[]
  publicationStatus: PublicationStatusType
  curationStatus?: CurationStatusType
  explicit: boolean
  license: ContentLicenseType
  attribution?: string
};

export class MusicAlbumCodec extends EntityCodec<MusicAlbumType> { }

export function MusicAlbumToFormValues(entity?: MusicAlbumType): MusicAlbumFormValues {
  return {
    title: entity && entity.title || '',
    artist: entity && entity.artist || '',
    thumbnail: entity && entity.thumbnail || '',
    description: entity && entity.description || '',
    firstReleased: entity && entity.firstReleased || 0,
    genre: entity && entity.genre?.id || 0,
    mood: entity && entity.mood?.id || 0,
    theme: entity && entity.theme?.id || 0,
    tracks: entity && entity.tracks?.map(x => x.id) || [],
    language: entity && entity.language?.id || 0,
    link: entity && entity.link || [],
    lyrics: entity && entity.lyrics || '',
    composerOrSongwriter: entity && entity.composerOrSongwriter || '',
    reviews: entity && entity.reviews || [],
    publicationStatus: entity && entity.publicationStatus.id || 0,
    curationStatus: entity && entity.curationStatus?.id || 0,
    explicit: entity && entity.explicit || false,
    license: entity && entity.license.id || 0,
    attribution: entity && entity.attribution || ''
  }
}

export type MusicAlbumPropId =
  'title' |
  'artist' |
  'thumbnail' |
  'description' |
  'firstReleased' |
  'genre' |
  'mood' |
  'theme' |
  'tracks' |
  'language' |
  'link' |
  'lyrics' |
  'composerOrSongwriter' |
  'reviews' |
  'publicationStatus' |
  'curationStatus' |
  'explicit' |
  'license' |
  'attribution'
  ;

export type MusicAlbumGenericProp = {
  id: MusicAlbumPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type MusicAlbumClassType = {
  [id in MusicAlbumPropId]: MusicAlbumGenericProp
};

export const MusicAlbumClass: MusicAlbumClassType = {
  title: {
    "id": "title",
    "name": "Title",
    "description": "The title of the album",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  artist: {
    "id": "artist",
    "name": "Artist",
    "description": "The artist, composer, band or group that published the album.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  thumbnail: {
    "id": "thumbnail",
    "name": "Thumbnail",
    "description": "URL to album cover art thumbnail: NOTE: Should be an https link to a square image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Information about the album and artist.",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  firstReleased: {
    "id": "firstReleased",
    "name": "First Released",
    "description": "When the album was first released",
    "required": true,
    "type": "Int64"
  },
  genre: {
    "id": "genre",
    "name": "Genre",
    "description": "The genre of the album.",
    "type": "Internal",
    "classId": "Music Genre"
  },
  mood: {
    "id": "mood",
    "name": "Mood",
    "description": "The mood of the album.",
    "type": "Internal",
    "classId": "Music Mood"
  },
  theme: {
    "id": "theme",
    "name": "Theme",
    "description": "The theme of the album.",
    "type": "Internal",
    "classId": "Music Theme"
  },
  tracks: {
    "id": "tracks",
    "name": "Tracks",
    "description": "The tracks of the album.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Music Track"
  },
  language: {
    "id": "language",
    "name": "Language",
    "description": "The language of the song lyrics in the album.",
    "required": false,
    "type": "Internal",
    "classId": "Language"
  },
  link: {
    "id": "link",
    "name": "Link",
    "description": "Links to the artist or album site or social media pages.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  lyrics: {
    "id": "lyrics",
    "name": "Lyrics",
    "description": "Link to the album tracks lyrics.",
    "type": "Text",
    "maxTextLength": 255
  },
  composerOrSongwriter: {
    "id": "composerOrSongwriter",
    "name": "Composer or songwriter",
    "description": "The composer(s) and/or songwriter(s) of the album.",
    "type": "Text",
    "maxTextLength": 255
  },
  reviews: {
    "id": "reviews",
    "name": "Reviews",
    "description": "Links to reviews of the album.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the album.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "id": "curationStatus",
    "name": "Curation Status",
    "description": "The publication status of the album set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "id": "explicit",
    "name": "Explicit",
    "description": "Indicates whether the album contains explicit material.",
    "required": true,
    "type": "Bool"
  },
  license: {
    "id": "license",
    "name": "License",
    "description": "The license of which the album is released under.",
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
  }
};
