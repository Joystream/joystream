import fs from 'fs'
import path from 'path'
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client'
import fetch from 'cross-fetch'

type categoryType = {
  id: string
  name: string
}

async function main() {
  const env = process.env
  const queryNodeUrl: string = env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'

  console.log(`Connecting to Query Node at: ${queryNodeUrl}`)
  const queryNodeProvider = new ApolloClient({
    link: new HttpLink({ uri: queryNodeUrl, fetch }),
    cache: new InMemoryCache(),
  })

  const videoCategories = await getCategories(queryNodeProvider, 'videoCategories')

  const channelCategories = await getCategories(queryNodeProvider, 'channelCategories')

  fs.writeFileSync(
    path.resolve(__dirname, '../data/videoCategories.json'),
    JSON.stringify(videoCategories, undefined, 4)
  )
  fs.writeFileSync(
    path.resolve(__dirname, '../data/channelCategories.json'),
    JSON.stringify(channelCategories, undefined, 4)
  )

  console.log(`${videoCategories.length} video categories exported & saved!`)
  console.log(`${channelCategories.length} channel categories exported & saved!`)
}

async function getCategories(queryNodeProvider, categoryType): Promise<Array<categoryType>> {
  const GET_ALL_CATEGORY_ITEMS = gql`
    query {
      ${categoryType} {
        id
        name
      }
    }
  `
  const queryResult = await queryNodeProvider.query({ query: GET_ALL_CATEGORY_ITEMS })
  const categories = queryResult.data[categoryType].map(({ id, name }) => {
    return {
      id,
      name,
    }
  })
  return categories
}

main()
  .then(() => process.exit())
  .catch(console.error)
