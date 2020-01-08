import { newEntityId } from './EntityId.mock';
import { MusicThemeType } from '../schemas/music/MusicTheme';

const values = [
  'Dark',
  'Light',
];

export const AllMusicThemes: MusicThemeType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const MusicTheme = AllMusicThemes[0];
