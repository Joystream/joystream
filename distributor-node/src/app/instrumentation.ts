import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { FsInstrumentation } from '@opentelemetry/instrumentation-fs'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ClientRequest, ServerResponse } from 'http'
import pkgDir from 'pkg-dir'
import { ConfigParserService } from '../services/parsers/ConfigParserService'
import { ReadonlyConfig } from '../types'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

diag.info('Starting tracing...')

// Default config JSON/YAML file path (relative to current working directory)
let configPath = process.env.CONFIG_PATH || `${pkgDir.sync(__dirname)}/config.yml`

// Check if configPath is passed as an argument
const [configPathArg] = process.argv.filter((arg) => arg.startsWith('--configPath'))
if (configPathArg) {
  configPath = configPathArg.split('=')[1]
}

// Parse config file
const configParser = new ConfigParserService(configPath)
const { otlp } = configParser.parse() as ReadonlyConfig

// Set required env variables for the Elasticsearch exporters
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = otlp?.endpoint
process.env.OTEL_RESOURCE_ATTRIBUTES = otlp?.attributes
process.env.OTEL_METRICS_EXPORTER = 'otlp'

// Initialize SDK
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
      applyCustomAttributesOnSpan: (span, req, res) => {
        const reqPath = (req as ClientRequest).path

        // Set span name for QueryNode requests
        if (reqPath === '/graphql') {
          span.updateName('QueryNode')
        }

        // Set span name for Colossus requests
        if (reqPath.includes('api/v1/version') || reqPath.includes('api/v1/files')) {
          span.updateName('Colossus')
        }

        // Set headers as span attributes for assets requests
        if (reqPath.includes('api/v1/assets')) {
          span.setAttributes((res as ServerResponse).getHeaders())
        }
      },
    }),
    new ExpressInstrumentation(),
    new FsInstrumentation(),
  ],
})

// Start Opentelemetry NodeJS SDK
sdk.start()

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0))
})
