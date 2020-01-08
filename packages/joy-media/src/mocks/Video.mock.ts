import { newEntityId } from './EntityId.mock';
import { VideoType } from '../schemas/video/Video';
import { Language } from './Language.mock';
import { VideoCategory } from './VideoCategory.mock';
import { PublicationStatus } from './PublicationStatus.mock';
import { ContentLicense } from './ContentLicense.mock';
import { CurationStatus } from './CurationStatus.mock';

export const Video: VideoType = {
  id: newEntityId(),
  title: 'Лесные приключения букашки',
  thumbnail: 'https://images.unsplash.com/photo-1526749837599-b4eba9fd855e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  description: 'Путеше́ствие — передвижение по какой-либо территории или акватории с целью их изучения, а также с общеобразовательными, познавательными, спортивными и другими целями.\n\nДо XIX века путешествия были одним из основных источников получения сведений о тех или иных странах (их природе, населении, истории, хозяйстве), общем характере и очертании поверхности Земли.',
  language: Language,
  firstReleased: 567425543, // 1987 year.
  category: VideoCategory,
  link: [],
  object: undefined,
  publicationStatus: PublicationStatus,
  curationStatus: CurationStatus,
  explicit: true,
  license: ContentLicense,
  attribution: undefined
};
