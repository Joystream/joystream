import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

/** Opentelemetry Instrumentation for Query Node's graphql-server */

export const GraphqlServerInstrumentation = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter(), {
    maxQueueSize: parseInt(process.env.OTEL_MAX_QUEUE_SIZE || '8192'),
    maxExportBatchSize: parseInt(process.env.OTEL_MAX_EXPORT_BATCH_SIZE || '1024'),
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [
    // Disable DNS instrumentation, because the instrumentation does not correctly patches `dns.lookup` function
    // if the function is converted to a promise-based method using `utils.promisify(dns.lookup)`
    // See: https://github.com/Joystream/joystream/pull/4779#discussion_r1262515887
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-pg': { enhancedDatabaseReporting: true },
      '@opentelemetry/instrumentation-graphql': { allowValues: true },
    }),
  ],
})
