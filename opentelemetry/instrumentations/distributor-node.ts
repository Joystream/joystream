import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { FsInstrumentation } from '@opentelemetry/instrumentation-fs'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ClientRequest, ServerResponse } from 'http'

/** Opentelemetry Instrumentation for Joystream Distributor Node */

export const DistributorNodeInstrumentation = new NodeSDK({
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
