import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

/** Instrument any arbitrary Node.js application with the default Opentelemetry instrumentations */

export const DefaultInstrumentation = new NodeSDK({
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter(), {
    maxQueueSize: 8192 /* 4 times of default queue size */,
    maxExportBatchSize: 1024 /* 2 times of default batch size */,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [
    // Disable DNS instrumentation, because the instrumentation does not correctly patches `dns.lookup` function
    // if the function is converted to a promise-based method using `utils.promisify(dns.lookup)`
    // See: https://github.com/Joystream/joystream/pull/4779#discussion_r1262515887
    getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-dns': { enabled: false } }),
  ],
})
