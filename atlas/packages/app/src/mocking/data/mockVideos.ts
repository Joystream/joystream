import { shuffle } from 'lodash'
import { posterSources } from './mockImages'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'

const rawVideos = [
  {
    id: 'fbe69436-80a7-4695-b154-57fa274ec4fc',
    title: 'semper sapien a libero',
    description:
      'Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis. Ut at dolor quis odio consequat varius. Integer ac leo. Pellentesque ultrices mattis odio. Donec vitae nisi. Nam ultrices, libero non mattis pulvinar, nulla pede ullamcorper augue, a suscipit nulla elit ac nulla.',
    views: 888346,
    publishedOnJoystreamAt: '2017-08-25T13:40:41Z',
    duration: 487,
  },
  {
    id: '9afcca7b-f82a-4a79-a664-17dbe55af1e2',
    title: 'eleifend',
    description:
      'Integer ac leo. Pellentesque ultrices mattis odio. Donec vitae nisi. Nam ultrices, libero non mattis pulvinar, nulla pede ullamcorper augue, a suscipit nulla elit ac nulla. Sed vel enim sit amet nunc viverra dapibus. Nulla suscipit ligula in lacus. Curabitur at ipsum ac tellus semper interdum. Mauris ullamcorper purus sit amet nulla. Quisque arcu libero, rutrum ac, lobortis vel, dapibus at, diam. Nam tristique tortor eu pede.',
    views: 1057608,
    publishedOnJoystreamAt: '2018-12-04T12:56:11Z',
    duration: 71,
  },
  {
    id: 'cd214dd2-6f29-4473-a60a-c665c0eb9df0',
    title: 'vestibulum ante',
    description:
      'Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
    views: 960251,
    publishedOnJoystreamAt: '2013-07-10T13:01:00Z',
    duration: 442,
  },
  {
    id: '377031af-cd19-41c5-8efe-7a308b33ceb2',
    title: 'curae nulla',
    description:
      'Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi. Cras non velit nec nisi vulputate nonummy. Maecenas tincidunt lacus at velit. Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis.',
    views: 529466,
    publishedOnJoystreamAt: '2019-09-04T14:56:26Z',
    duration: 315,
  },
  {
    id: '502c026c-a9c4-4042-a6b1-6391e7bb1908',
    title: 'ac diam',
    description:
      'Proin at turpis a pede posuere nonummy. Integer non velit. Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec pharetra, magna vestibulum aliquet ultrices, erat tortor sollicitudin mi, sit amet lobortis sapien sapien non mi. Integer ac neque. Duis bibendum. Morbi non quam nec dui luctus rutrum. Nulla tellus.',
    views: 1021837,
    publishedOnJoystreamAt: '2011-11-07T12:32:01Z',
    duration: 3606,
  },
  {
    id: '97870b76-b657-4025-94ba-feaaca42c798',
    title: 'tempor convallis',
    description:
      'Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh. Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros. Vestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
    views: 196110,
    publishedOnJoystreamAt: '2016-04-30T02:36:12Z',
    duration: 134,
  },
  {
    id: 'd3ecc339-369d-4c74-b914-3a695ba5a68c',
    title: 'donec vitae nisi',
    description:
      'Vivamus in felis eu sapien cursus vestibulum. Proin eu mi. Nulla ac enim. In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem. Duis aliquam convallis nunc. Proin at turpis a pede posuere nonummy. Integer non velit. Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue.',
    views: 95954,
    publishedOnJoystreamAt: '2011-11-23T02:46:49Z',
    duration: 716,
  },
  {
    id: '7e33bb53-f114-4fc3-adb8-13ad72811a07',
    title: 'duis mattis egestas metus duis mattis',
    description:
      'In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem. Integer tincidunt ante vel ipsum. Praesent blandit lacinia erat. Vestibulum sed magna at nunc commodo placerat. Praesent blandit. Nam nulla. Integer pede justo, lacinia eget, tincidunt eget, tempus vel, pede.',
    views: 870023,
    publishedOnJoystreamAt: '2020-01-07T13:17:49Z',
    duration: 16,
  },
  {
    id: 'c557b154-ee2a-4548-a0c5-4a74774ecf58',
    title: 'cursus',
    description:
      'Mauris lacinia sapien quis libero. Nullam sit amet turpis elementum ligula vehicula consequat. Morbi a ipsum. Integer a nibh.',
    views: 429603,
    publishedOnJoystreamAt: '2018-05-16T15:55:50Z',
    duration: 1181,
  },
  {
    id: 'a07dd663-48f6-4bf7-9212-944660d5a90a',
    title: 'velit eu est congue velit eu est congue velit eu est congue',
    description:
      'Sed sagittis. Nam congue, risus semper porta volutpat, quam pede lobortis ligula, sit amet eleifend pede libero quis orci. Nullam molestie nibh in lectus. Pellentesque at nulla. Suspendisse potenti. Cras in purus eu magna vulputate luctus.',
    views: 258527,
    publishedOnJoystreamAt: '2020-08-10T12:32:00Z',
    duration: 307,
  },
]

type RawVideo = Omit<VideoFields, 'media' | 'channel' | 'publishedOnJoystreamAt' | 'duration'> & {
  publishedOnJoystreamAt: unknown
  duration: unknown
}

const shuffledRawVideos = shuffle(rawVideos)
const mockVideos: RawVideo[] = shuffledRawVideos.map((rawVideo, idx) => {
  return {
    ...rawVideo,
    __typename: 'Video',
    thumbnailURL: posterSources[idx % posterSources.length],
  }
})

export default mockVideos
