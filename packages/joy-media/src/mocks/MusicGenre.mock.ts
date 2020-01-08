import { newEntityId } from './EntityId.mock';
import { MusicGenreType } from '../schemas/music/MusicGenre';

const values = [
  'Pop',
  'Rock',
  'Metal',
  'Rap',
  'Techno',
  'Classical Music',
];

export const AllMusicGenres: MusicGenreType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const MusicGenre = AllMusicGenres[0];
