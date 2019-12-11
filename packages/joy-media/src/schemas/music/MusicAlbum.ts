
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicAlbumValidationSchema = Yup.object().shape({
  albumTitle: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  albumArtist: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  albumCover: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  aboutTheAlbum: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  lyrics: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  composerOrSongwriter: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type MusicAlbumType = {
  albumTitle: string
  albumArtist: string
  albumCover: string
  aboutTheAlbum: string
  firstReleased: number
  genre?: any[]
  mood?: any[]
  theme?: any[]
  tracks?: any[]
  language?: any[]
  link?: string[]
  lyrics?: string
  composerOrSongwriter?: string
  reviews?: string[]
  publicationStatus: any
  curationStatus?: any
  explicit: boolean
  license: any
  attribution?: string
};

export const MusicAlbumClass = {
  albumTitle: {
    "name": "Album Title",
    "description": "The title of the album",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  albumArtist: {
    "name": "Album Artist",
    "description": "The artist, composer, band or group that published the album.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  albumCover: {
    "name": "Album Cover",
    "description": "URL to album cover art thumbnail: NOTE: Should be an https link to a square image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  aboutTheAlbum: {
    "name": "About the Album",
    "description": "Information about the album and artist.",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  firstReleased: {
    "name": "First Released",
    "description": "When the track was first released",
    "required": true,
    "type": "Int64"
  },
  genre: {
    "name": "Genre",
    "description": "The genre(s) of the album.",
    "type": "InternalVec",
    "maxItems": 3,
    "classId": "Music Genre"
  },
  mood: {
    "name": "Mood",
    "description": "The mood(s) of the album.",
    "type": "InternalVec",
    "maxItems": 3,
    "classId": "Music Mood"
  },
  theme: {
    "name": "Theme",
    "description": "The theme(s) of the album.",
    "type": "InternalVec",
    "maxItems": 3,
    "classId": "Music Theme"
  },
  tracks: {
    "name": "Tracks",
    "description": "The tracks of the album.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Music Track"
  },
  language: {
    "name": "Language",
    "description": "The language of the song lyrics in the album.",
    "required": false,
    "type": "InternalVec",
    "maxItems": 5,
    "classId": "Language"
  },
  link: {
    "name": "Link",
    "description": "Links to the artist or album site or social media pages.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  lyrics: {
    "name": "Lyrics",
    "description": "Link to the album tracks lyrics.",
    "type": "Text",
    "maxTextLength": 255
  },
  composerOrSongwriter: {
    "name": "Composer or songwriter",
    "description": "The composer(s) and/or songwriter(s) of the album.",
    "type": "Text",
    "maxTextLength": 255
  },
  reviews: {
    "name": "Reviews",
    "description": "Links to reviews of the album.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  publicationStatus: {
    "name": "Publication Status",
    "description": "The publication status of the album.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "name": "Curation Status",
    "description": "The publication status of the album set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "name": "Explicit",
    "description": "Indicates whether the track contains explicit material.",
    "required": true,
    "type": "Bool"
  },
  license: {
    "name": "License",
    "description": "The license of which the album is released under.",
    "required": true,
    "type": "Internal",
    "classId": "Content License"
  },
  attribution: {
    "name": "Attribution",
    "description": "If the License requires attribution, add this here.",
    "type": "Text",
    "maxTextLength": 255
  }
};
