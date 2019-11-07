export type MusicTrackEntity = {

  // Basic:
  name: string,
  description?: string,
  thumbnail?: string,
  visibility?: string,
  album?: string,

  // Additional:
  artist?: string,
  composer?: string,
  genre?: string,
  mood?: string,
  theme?: string,
  explicit?: boolean,
  license?: string,
};
