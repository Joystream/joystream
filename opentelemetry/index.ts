import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { config } from 'dotenv'
import path from 'path'
import { DefaultInstrumentation, DistributorNodeInstrumentation, StorageNodeInstrumentation } from './instrumentations'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

async function addInstrumentation() {
  // Load env variables
  config({ path: path.join(__dirname, '../.env') })

  const applicationName = process.env.OTEL_APPLICATION

  let instrumentation: NodeSDK
  if (applicationName) {
    if (applicationName === 'distributor-node') {
      instrumentation = DistributorNodeInstrumentation
      diag.info(`Loaded Application Instrumentation: "Distributor Node"`)
    } else if (applicationName === 'storage-node') {
      instrumentation = StorageNodeInstrumentation
      diag.info(`Loaded Application Instrumentation: "Storage Node"`)
    } else if (applicationName === 'query-node') {
      instrumentation = DefaultInstrumentation
      diag.info(`Loaded Application Instrumentation: "Query Node"`)
    } else {
      instrumentation = DefaultInstrumentation
      diag.warn(
        `Opentelemetry instrumentation for package/application "${applicationName}"` +
          ` does not exist. Falling back to running "Default" instrumentation.`
      )
    }
  } else {
    instrumentation = DefaultInstrumentation
    diag.info(`Loaded Application Instrumentation: "Default"`)
  }

  // Start Opentelemetry NodeJS Instrumentation
  diag.info('Starting tracing...')
  instrumentation.start()

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    instrumentation
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0))
  })
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
addInstrumentation()
