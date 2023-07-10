import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import axios from 'axios'
import { DefaultInstrumentation, DistributorNodeInstrumentation, StorageNodeInstrumentation } from './instrumentations'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

async function checkApmServer(apmServerUrl: string, retryInterval = 6000, retryAttempts = 10): Promise<void> {
  let attempts = 0

  const wait = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  while (attempts < retryAttempts) {
    attempts++
    try {
      const response = await axios.get(apmServerUrl)

      if (response.status === 200) {
        console.log('APM server is running.')
        return
      } else {
        console.log('APM server may not be running correctly.')
      }
    } catch (error: any) {
      console.error(`Failed to reach APM server, attempt ${attempts}:`, error.message)
      if (attempts < retryAttempts) {
        await wait(retryInterval)
      } else {
        console.log(`Failed to reach APM server after ${attempts} attempts.`)
        process.exit(1)
      }
    }
  }
}

async function addInstrumentation() {
  const applicationName = process.env.OTEL_APPLICATION
  const apmServerUrl = 'http://localhost:8200'
  await checkApmServer(process.env.OTEL_EXPORTER_OTLP_ENDPOINT || apmServerUrl)

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
      diag.error(
        `Opentelemetry instrumentation for package/application "${applicationName}" does not exist` +
          ` Add instrumentation for package, or try to run application with default instrumentation`
      )
      process.exit(1)
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
