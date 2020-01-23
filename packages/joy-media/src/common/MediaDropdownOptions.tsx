import ISO6391 from 'iso-639-1';
import { DropdownItemProps } from 'semantic-ui-react';
import { LanguageType } from '../schemas/general/Language';
import { ContentLicenseType } from '../schemas/general/ContentLicense';
import { CurationStatusType } from '../schemas/general/CurationStatus';
import { MusicGenreType } from '../schemas/music/MusicGenre';
import { MusicMoodType } from '../schemas/music/MusicMood';
import { MusicThemeType } from '../schemas/music/MusicTheme';
import { PublicationStatusType } from '../schemas/general/PublicationStatus';
import { VideoCategoryType } from '../schemas/video/VideoCategory';
import { TextValueEntity } from '@joystream/types/versioned-store/EntityCodec';

const buildOptions = (entities: TextValueEntity[]): DropdownItemProps[] =>
  entities.map(x => ({ key: x.id, value: x.id, text: x.value }))

const buildLanguageOptions = (entities: LanguageType[]): DropdownItemProps[] =>
  entities.map(x => ({ key: x.id, value: x.id, text: ISO6391.getName(x.value) }))

type MediaDropdownInitialProps = {
  languages: LanguageType[]
  contentLicenses: ContentLicenseType[]
  curationStatuses: CurationStatusType[]
  musicGenres: MusicGenreType[]
  musicMoods: MusicMoodType[]
  musicThemes: MusicThemeType[]
  publicationStatuses: PublicationStatusType[]
  videoCategories: VideoCategoryType[]
}

export class MediaDropdownOptions {

  public languageOptions: DropdownItemProps[]
  public contentLicenseOptions: DropdownItemProps[]
  public curationStatusOptions: DropdownItemProps[]
  public musicGenreOptions: DropdownItemProps[]
  public musicMoodOptions: DropdownItemProps[]
  public musicThemeOptions: DropdownItemProps[]
  public publicationStatusOptions: DropdownItemProps[]
  public videoCategoryOptions: DropdownItemProps[]

  constructor (props: MediaDropdownInitialProps) {
    this.languageOptions = buildLanguageOptions(props.languages);
    this.contentLicenseOptions = buildOptions(props.contentLicenses);
    this.curationStatusOptions = buildOptions(props.curationStatuses);
    this.musicGenreOptions = buildOptions(props.musicGenres);
    this.musicMoodOptions = buildOptions(props.musicMoods);
    this.musicThemeOptions = buildOptions(props.musicThemes);
    this.publicationStatusOptions = buildOptions(props.publicationStatuses);
    this.videoCategoryOptions = buildOptions(props.videoCategories);
  }

  static Empty = new MediaDropdownOptions({
    languages: [],
    contentLicenses: [],
    curationStatuses: [],
    musicGenres: [],
    musicMoods: [],
    musicThemes: [],
    publicationStatuses: [],
    videoCategories: [],
  });
}