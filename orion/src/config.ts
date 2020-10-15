import dotenv from 'dotenv'

dotenv.config()

const isDev = process.env.NODE_ENV === 'development'

type LoadEnvVarOpts = {
  defaultValue?: string
  devDefaultValue?: string
}
const loadEnvVar = (name: string, { defaultValue, devDefaultValue }: LoadEnvVarOpts): string => {
  const value = process.env[name]
  if (value) {
    return value
  }

  if (isDev && devDefaultValue) {
    return devDefaultValue
  }

  if (defaultValue) {
    return defaultValue
  }

  throw new Error(`Required env variable "${name}" is missing from the environment`)
}

const rawPort = loadEnvVar('ORION_PORT', { defaultValue: '6116' })
const port = parseInt(rawPort)
const mongoDBUri = loadEnvVar('ORION_MONGO_URI', { devDefaultValue: 'mongodb://localhost:27017/orion' })

export default {
  port,
  mongoDBUri,
}
