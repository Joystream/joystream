/* eslint-disable @typescript-eslint/no-var-requires */

const faker = require('faker')
const { saveToFile, randomRange } = require('./utils')

const OUTPUT_FILENAME = 'channels.json'
const CHANNELS_COUNT = 10

const generateChannel = () => {
  const handleWordsCount = randomRange(1, 4)
  return {
    id: faker.random.uuid(),
    handle: faker.lorem.words(handleWordsCount),
    totalViews: faker.random.number(150000),
  }
}

const main = async () => {
  const channels = Array.from({ length: CHANNELS_COUNT }, generateChannel)
  await saveToFile(channels, OUTPUT_FILENAME)
}

main()
