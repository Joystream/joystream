import { newEntityId } from './EntityId.mock';
import { MusicGenreType } from '../schemas/music/MusicGenre';

const values = [
  'Avant-Garde',
  'Blues',
  'Children\'s',
  'Classical',
  'Comedy/Spoken',
  'Country',
  'Easy Listening',
  'Electronic',
  'Folk',
  'Holiday',
  'International',
  'Jazz',
  'Latin',
  'New Age',
  'Pop/Rock',
  'R&B',
  'Rap',
  'Reggae',
  'Religious',
  'Stage & Screen',
  'Vocal'
];

export const AllMusicGenres: MusicGenreType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const MusicGenre = AllMusicGenres[0];
