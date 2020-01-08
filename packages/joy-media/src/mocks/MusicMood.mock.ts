import { newEntityId } from './EntityId.mock';
import { MusicMoodType } from '../schemas/music/MusicMood';

const values = [
  ''
];

export const AllMusicMoods: MusicMoodType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const MusicMood = AllMusicMoods[0];
