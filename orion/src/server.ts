import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-express'
import Express from 'express'
import { connect } from 'mongoose'
import { buildSchema } from 'type-graphql'
import { VideoInfosResolver } from './resolvers/videoInfos'
import config from './config'

const main = async () => {
  const schema = await buildSchema({
    resolvers: [VideoInfosResolver],
    emitSchemaFile: 'schema.graphql',
    validate: true,
  })

  process.stdout.write(`Connecting to MongoDB at "${config.mongoDBUri}"...`)
  try {
    const mongoose = await connect(config.mongoDBUri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    })
    await mongoose.connection
  } catch {
    process.stdout.write(' Failed!\n')
    process.exit()
    return
  }
  process.stdout.write(' Done.\n')

  const server = new ApolloServer({ schema })
  const app = Express()
  server.applyMiddleware({ app })
  app.listen({ port: config.port }, () =>
    console.log(`🚀 Server listening at ==> http://localhost:${config.port}${server.graphqlPath}`)
  )
}

main()
