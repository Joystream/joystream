import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { FsInstrumentation } from '@opentelemetry/instrumentation-fs'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ClientRequest } from 'http'
import pkgDir from 'pkg-dir'
import { ConfigParserService } from '../services/parsers/ConfigParserService'
import { ReadonlyConfig } from '../types'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

console.log('Starting tracing...')

let configPath = process.env.CONFIG_PATH || `${pkgDir.sync(__dirname)}/config.json`

const configPathArgIndex = process.argv.indexOf('--configPath')
if (configPathArgIndex > -1) {
  configPath = process.argv[configPathArgIndex + 1]
  console.log(configPath) // Outputs: path/to/file
}

const configParser = new ConfigParserService(configPath)
const appConfig = configParser.parse() as ReadonlyConfig
console.log(appConfig)

const sdk = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter(), {
    maxQueueSize: 8192 /* 4 times of default queue size */,
    maxExportBatchSize: 1024 /* 2 times of default batch size */,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [
    new HttpInstrumentation({
      applyCustomAttributesOnSpan: (span, req) => {
        if ((req as ClientRequest).path === '/graphql') {
          span.updateName('QueryNode')
        }
      },
    }),
    new ExpressInstrumentation(),
    new FsInstrumentation(),
  ],
})

sdk.start()

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0))
})
