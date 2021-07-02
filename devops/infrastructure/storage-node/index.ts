import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import * as fs from 'fs'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const wsProviderEndpointURI = config.require('wsProviderEndpointURI')
const isProduction = config.require('isProduction') === 'true'

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc('vpc', { numberOfAvailabilityZones: 2 })

// Create an EKS cluster with the default configuration.
const cluster = new eks.Cluster('eksctl-my-cluster', {
  vpcId: vpc.id,
  subnetIds: vpc.publicSubnetIds,
  instanceType: 't2.micro',
  providerCredentialOpts: {
    profileName: awsConfig.get('profile'),
  },
})

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig

// Create a repository
const repo = new awsx.ecr.Repository('colossus-image')

// Build an image and publish it to our ECR repository.
export const colossusImage = repo.buildAndPushImage({
  dockerfile: '../../../colossus.Dockerfile',
  context: '../../../',
})

const name = 'storage-node'
const colossusPort = 3001

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, { provider: cluster.provider })

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

// Create a LoadBalancer Service for the Deployment
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
    },
    spec: {
      type: 'LoadBalancer',
      ports: [{ name: 'port-1', port: colossusPort }],
      selector: appLabels,
    },
  },
  {
    provider: cluster.provider,
  }
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name
// When "done", this will print the hostname
export let serviceHostname: pulumi.Output<string>
serviceHostname = service.status.loadBalancer.ingress[0].hostname

const publicUrlInput: pulumi.Input<string> = pulumi.interpolate`http://${serviceHostname}:${colossusPort}/`

let additionalParams: string[] | pulumi.Input<string>[] = []

let volumeMounts: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.VolumeMount>[]> = []
let volumes: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.Volume>[]> = []

if (isProduction) {
  const remoteKeyFilePath = '/joystream/key-file.json'
  const providerId = config.require('providerId')
  const keyFile = config.require('keyFile')
  const publicUrl = config.get('publicURL') ? config.get('publicURL')! : publicUrlInput

  const keyConfig = new k8s.core.v1.ConfigMap(name, {
    metadata: { namespace: namespaceName, labels: appLabels },
    data: { 'fileData': fs.readFileSync(keyFile).toString() },
  })
  const keyConfigName = keyConfig.metadata.apply((m) => m.name)

  additionalParams = ['--provider-id', providerId, '--key-file', remoteKeyFilePath, '--public-url', publicUrl]

  volumeMounts.push({
    mountPath: remoteKeyFilePath,
    name: 'keyfile-volume',
    subPath: 'fileData',
  })

  volumes.push({
    name: 'keyfile-volume',
    configMap: {
      name: keyConfigName,
    },
  })

  const passphrase = config.get('passphrase')
  if (passphrase) {
    additionalParams.push('--passphrase', passphrase)
  }
} else {
  additionalParams.push('--anonymous')
}

// Create a Deployment
const deployment = new k8s.apps.v1.Deployment(
  name,
  {
    metadata: {
      namespace: namespaceName,
      labels: appLabels,
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: appLabels },
      template: {
        metadata: {
          labels: appLabels,
        },
        spec: {
          hostname: 'ipfs',
          containers: [
            {
              name: 'ipfs',
              image: 'ipfs/go-ipfs:latest',
              ports: [{ containerPort: 5001 }, { containerPort: 8080 }],
              command: ['/bin/sh', '-c'],
              args: [
                'set -e; \
                /usr/local/bin/start_ipfs config profile apply lowpower; \
                /usr/local/bin/start_ipfs config --json Gateway.PublicGateways \'{"localhost": null }\'; \
                /usr/local/bin/start_ipfs config Datastore.StorageMax 200GB; \
                /sbin/tini -- /usr/local/bin/start_ipfs daemon --migrate=true',
              ],
            },
            {
              name: 'colossus',
              image: colossusImage,
              env: [
                {
                  name: 'WS_PROVIDER_ENDPOINT_URI',
                  // example 'wss://18.209.241.63.nip.io/'
                  value: wsProviderEndpointURI,
                },
                {
                  name: 'DEBUG',
                  value: 'joystream:*',
                },
              ],
              volumeMounts,
              command: [
                'yarn',
                'colossus',
                '--ws-provider',
                wsProviderEndpointURI,
                '--ipfs-host',
                'ipfs',
                ...additionalParams,
              ],
              ports: [{ containerPort: 3001 }],
            },
          ],
          volumes,
        },
      },
    },
  },
  {
    provider: cluster.provider,
  }
)

// Export the Deployment name
export const deploymentName = deployment.metadata.name

// Create a CloudFront distribution
const distributionArgs: aws.cloudfront.DistributionArgs = {
  enabled: true,
  origins: [
    {
      originId: 'storage-node-load-balancer',
      domainName: serviceHostname,
      customOriginConfig: {
        originProtocolPolicy: 'http-only',
        httpPort: colossusPort,
        httpsPort: colossusPort,
        originSslProtocols: ['TLSv1'],
      },
    },
  ],

  defaultCacheBehavior: {
    targetOriginId: 'storage-node-load-balancer',

    viewerProtocolPolicy: 'allow-all',
    allowedMethods: ['GET', 'HEAD'],
    cachedMethods: ['GET', 'HEAD'],

    forwardedValues: {
      cookies: { forward: 'none' },
      queryString: false,
    },
  },

  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
}

const cloudfront = new aws.cloudfront.Distribution(`storage-node`, distributionArgs)

export const cloudFrontDomain = cloudfront.domainName
