import { newEntityId } from './EntityId.mock';
import { MusicAlbumType } from '../schemas/music/MusicAlbum';
import { MusicGenre } from './MusicGenre.mock';
import { MusicMood } from './MusicMood.mock';
import { MusicTheme } from './MusicTheme.moc';
import { PublicationStatus } from './PublicationStatus.mock';
import { ContentLicense } from './ContentLicense.mock';
import { CurationStatus } from './CurationStatus.mock';

export const MusicAlbum: MusicAlbumType = {
  id: newEntityId(),
  title: 'Riddle',
  artist: 'Liquid Stone',
  thumbnail: 'https://images.unsplash.com/photo-1484352491158-830ef5692bb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  description: 'Building material is any material which is used for construction purposes. Many naturally occurring substances, such as clay, rocks, sand, and wood, even twigs and leaves, have been used to construct buildings.\n\nApart from naturally occurring materials, many man-made products are in use, some more and some less synthetic.',
  firstReleased: 567425123, // 1987 year.
  genre: MusicGenre,
  mood: MusicMood,
  theme: MusicTheme,
  tracks: [],
  language: { value: 'DE' },
  link: [],
  lyrics: undefined,
  composerOrSongwriter: 'Massive Sand',
  reviews: [],
  publicationStatus: PublicationStatus,
  curationStatus: CurationStatus,
  explicit: false,
  license: ContentLicense,
  attribution: undefined
};
