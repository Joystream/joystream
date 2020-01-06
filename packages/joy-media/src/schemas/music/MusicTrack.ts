
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { LanguageType } from '../general/Language';
import { MusicGenreType } from './MusicGenre';
import { MusicMoodType } from './MusicMood';
import { MusicThemeType } from './MusicTheme';
import { MediaObjectType } from '../general/MediaObject';
import { PublicationStatusType } from '../general/PublicationStatus';
import { CurationStatusType } from '../general/CurationStatus';
import { ContentLicenseType } from '../general/ContentLicense';

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
  language: string
  firstReleased: string
  genre: string
  mood: string
  theme: string
  link: string
  composerOrSongwriter: string
  lyrics: string
  object: string
  publicationStatus: string
  curationStatus: string
  explicit: string
  license: string
  attribution: string
};

export type MusicTrackType = {
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
};

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
  'attribution'
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
  }
};
