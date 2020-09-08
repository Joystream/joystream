export type MusicAlbumEntity = {
  title: string;
  artist: string;
  thumbnail: string;
  description: string;

  explicit: boolean;
  license: string;

  year: number;
  month?: number;
  date?: number;

  genre?: string;
  mood?: string;
  theme?: string;

  language?: string;
  links?: string[];
  lyrics?: string;
  composer?: string;
  reviews?: string;

  // publicationStatus: ...
  // curationStatus: ...
};
