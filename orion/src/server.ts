import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-express'
import Express from 'express'
import { connect } from 'mongoose'
import { buildSchema } from 'type-graphql'
import { VideoInfosResolver } from './resolvers/videoInfos'

const main = async () => {
  const schema = await buildSchema({
    resolvers: [VideoInfosResolver],
    emitSchemaFile: 'schema.graphql',
    validate: true,
  })

  process.stdout.write('Connecting to MongoDB...')
  try {
    const mongoose = await connect('mongodb://localhost:27017/orion', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    })
    await mongoose.connection
  } catch {
    process.stdout.write(' Failed! \n')
    process.exit()
    return
  }
  process.stdout.write(' Done.\n')

  const server = new ApolloServer({ schema })
  const app = Express()
  server.applyMiddleware({ app })
  app.listen({ port: 3333 }, () =>
    console.log(`🚀 Server ready and listening at ==> http://localhost:3333${server.graphqlPath}`)
  )
}

main()
