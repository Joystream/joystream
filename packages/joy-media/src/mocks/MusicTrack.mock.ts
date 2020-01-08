import { newEntityId } from './EntityId.mock';
import { MusicTrackType } from '../schemas/music/MusicTrack';
import { MusicGenre } from './MusicGenre.mock';
import { MusicMood } from './MusicMood.mock';
import { MusicTheme } from './MusicTheme.moc';
import { PublicationStatus } from './PublicationStatus.mock';
import { CurationStatus } from './CurationStatus.mock';
import { ContentLicense } from './ContentLicense.mock';

export const MusicTrack: MusicTrackType = {
  id: newEntityId(),
  title: 'Requiem (Mozart)',
  artist: 'Berlin Philharmonic',
  thumbnail: 'https://assets.classicfm.com/2017/36/mozart-1504532179-list-handheld-0.jpg',
  description: 'The Requiem in D minor, K. 626, is a requiem mass by Wolfgang Amadeus Mozart (1756–1791). Mozart composed part of the Requiem in Vienna in late 1791, but it was unfinished at his death on 5 December the same year. A completed version dated 1792 by Franz Xaver Süssmayr was delivered to Count Franz von Walsegg, who commissioned the piece for a Requiem service to commemorate the anniversary of his wifes death on 14 February.',
  language: undefined,
  firstReleased: 567425967, // 1987 year.
  genre: MusicGenre,
  mood: MusicMood,
  theme: MusicTheme,
  link: [],
  composerOrSongwriter: 'Mozart',
  lyrics: undefined,
  object: undefined,
  publicationStatus: PublicationStatus,
  curationStatus: CurationStatus,
  explicit: false,
  license: ContentLicense,
  attribution: undefined
};