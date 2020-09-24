/* eslint-disable @typescript-eslint/no-var-requires */

const faker = require('faker')
const { saveToFile, randomRange } = require('./utils')

const OUTPUT_FILENAME = 'videos.json'
const VIDEOS_COUNT = 100

const generateVideo = () => {
  const titleWordsCount = randomRange(2, 6)
  const descriptionSentenceCount = randomRange(2, 12)
  return {
    id: faker.random.uuid(),
    title: faker.lorem.words(titleWordsCount),
    description: faker.lorem.sentences(descriptionSentenceCount),
    views: faker.random.number(150000),
    publishedOnJoystreamAt: faker.date.past(10),
  }
}

const main = async () => {
  const videos = Array.from({ length: VIDEOS_COUNT }, generateVideo)
  await saveToFile(videos, OUTPUT_FILENAME)
}

main()
