
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const MusicTrackValidationSchema = Yup.object().shape({
  trackTitle: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  trackArtist: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  trackThumbnail: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  aboutTheTrack: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  composerOrSongwriter: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  lyrics: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type MusicTrackType = {
  trackTitle: string
  trackArtist: string
  trackThumbnail: string
  aboutTheTrack?: string
  language?: any
  firstReleased: number
  genre?: any
  mood?: any
  theme?: any
  link?: string[]
  composerOrSongwriter?: string
  lyrics?: string
  object?: any
  publicationStatus: any
  curationStatus?: any
  license: any
  attribution?: string
};

export const MusicTrackClass = {
  trackTitle: {
    "name": "Track Title",
    "description": "The title of the track",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  trackArtist: {
    "name": "Track Artist",
    "description": "The artist, composer, band or group that published the track.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  trackThumbnail: {
    "name": "Track Thumbnail",
    "description": "URL to track cover art: NOTE: Should be an https link to a square image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  aboutTheTrack: {
    "name": "About the Track",
    "description": "Information about the track.",
    "type": "Text",
    "maxTextLength": 255
  },
  language: {
    "name": "Language",
    "description": "The language of the lyrics in the track.",
    "type": "Internal",
    "classId": "Language"
  },
  firstReleased: {
    "name": "First Released",
    "description": "When the track was first released",
    "required": true,
    "type": "Int64"
  },
  genre: {
    "name": "Genre",
    "description": "The genre of the track.",
    "type": "Internal",
    "classId": "Music Genre"
  },
  mood: {
    "name": "Mood",
    "description": "The mood of the track.",
    "type": "Internal",
    "classId": "Music Mood"
  },
  theme: {
    "name": "Theme",
    "description": "The theme of the track.",
    "type": "Internal",
    "classId": "Music Theme"
  },
  link: {
    "name": "Link",
    "description": "A link to the artist page.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  composerOrSongwriter: {
    "name": "Composer or songwriter",
    "description": "The composer(s) and/or songwriter(s) of the track.",
    "type": "Text",
    "maxTextLength": 255
  },
  lyrics: {
    "name": "Lyrics",
    "description": "Link to the track lyrics.",
    "type": "Text",
    "maxTextLength": 255
  },
  object: {
    "name": "Object",
    "description": "The entityId of the object in the data directory.",
    "type": "Internal",
    "classId": "Media Object"
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
  license: {
    "name": "License",
    "description": "The license of which the track is released under.",
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
