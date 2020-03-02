import { newEntityId } from './EntityId.mock';
import { VideoType } from '../schemas/video/Video';
import { Language } from './Language.mock';
import { VideoCategory } from './VideoCategory.mock';
import { DefaultPublicationStatus } from './PublicationStatus.mock';
import { DefaultCurationStatus } from './CurationStatus.mock';
import { ContentLicense } from './ContentLicense.mock';

const titles = [
	'Arborvitae (Thuja occidentalis)',
	'Black Ash (Fraxinus nigra)',
	'White Ash (Fraxinus americana)',
	'Bigtooth Aspen (Populus grandidentata)',
	'Quaking Aspen (Populus tremuloides)',
	'Basswood (Tilia americana)',
	'American Beech (Fagus grandifolia)',
	'Black Birch (Betula lenta)',
	'Gray Birch (Betula populifolia)',
	'Paper Birch (Betula papyrifera)',
	'Yellow Birch (Betula alleghaniensis)',
	'Butternut (Juglans cinerea)',
	'Black Cherry (Prunus serotina)',
	'Pin Cherry (Prunus pensylvanica)'
];

const thumbnails = [
	'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1484352491158-830ef5692bb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1543467091-5f0406620f8b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1526749837599-b4eba9fd855e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1504567961542-e24d9439a724?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1543716091-a840c05249ec?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  'https://images.unsplash.com/photo-1444465693019-aa0b6392460d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
];

export const AllVideos: VideoType[] = thumbnails.map((thumbnail, i) => ({
  id: newEntityId(),
  title: titles[i],
  thumbnail,
  description: 'Nature, in the broadest sense, is the natural, physical, or material world or universe. "Nature" can refer to the phenomena of the physical world, and also to life in general. The study of nature is a large, if not the only, part of science. Although humans are part of nature, human activity is often understood as a separate category from other natural phenomena.',
  language: Language,
  firstReleased: 567425543, // 1987 year.
  category: VideoCategory,
  link: [],
  object: undefined,
  publicationStatus: DefaultPublicationStatus,
  curationStatus: DefaultCurationStatus,
  explicit: true,
  license: ContentLicense,
  attribution: undefined
})) as unknown as VideoType[] // A hack to fix TS compilation.

export const Video = AllVideos[0];
