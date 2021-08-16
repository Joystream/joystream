import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { CaddyServiceDeployment } from 'pulumi-common'
import * as fs from 'fs'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const wsProviderEndpointURI = config.require('wsProviderEndpointURI')
const isAnonymous = config.require('isAnonymous') === 'true'
const lbReady = config.get('isLoadBalancerReady') === 'true'
const name = 'storage-node'
const colossusPort = parseInt(config.get('colossusPort') || '3000')
const storage = parseInt(config.get('storage') || '40')

let additionalParams: string[] | pulumi.Input<string>[] = []
let volumeMounts: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.VolumeMount>[]> = []
let volumes: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.Volume>[]> = []

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc('storage-node-vpc', { numberOfAvailabilityZones: 2 })

// Create an EKS cluster with the default configuration.
const cluster = new eks.Cluster('eksctl-storage-node', {
  vpcId: vpc.id,
  subnetIds: vpc.publicSubnetIds,
  instanceType: 't2.medium',
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

const resourceOptions = { provider: cluster.provider }

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

const pvc = new k8s.core.v1.PersistentVolumeClaim(
  `${name}-pvc`,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
      name: `${name}-pvc`,
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: `${storage}Gi`,
        },
      },
    },
  },
  resourceOptions
)

volumes.push({
  name: 'ipfs-data',
  persistentVolumeClaim: {
    claimName: `${name}-pvc`,
  },
})

const caddyEndpoints = [
  ` {
    reverse_proxy storage-node:${colossusPort}
}`,
]

const caddy = new CaddyServiceDeployment(
  'caddy-proxy',
  { lbReady, namespaceName: namespaceName, caddyEndpoints },
  resourceOptions
)

export const endpoint1 = caddy.primaryEndpoint
export const endpoint2 = caddy.secondaryEndpoint

export let appLink: pulumi.Output<string>

if (lbReady) {
  appLink = pulumi.interpolate`https://${endpoint1}`

  if (!isAnonymous) {
    const remoteKeyFilePath = '/joystream/key-file.json'
    const providerId = config.require('providerId')
    const keyFile = config.require('keyFile')
    const publicUrl = config.get('publicURL') ? config.get('publicURL')! : appLink

    const keyConfig = new k8s.core.v1.ConfigMap('key-config', {
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
  }
}

if (isAnonymous) {
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
              volumeMounts: [
                {
                  name: 'ipfs-data',
                  mountPath: '/data/ipfs',
                },
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
              ports: [{ containerPort: colossusPort }],
            },
          ],
          volumes,
        },
      },
    },
  },
  resourceOptions
)

// Create a LoadBalancer Service for the Deployment
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
      name: 'storage-node',
    },
    spec: {
      ports: [{ name: 'port-1', port: colossusPort }],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name
export const serviceName = service.metadata.name

// Export the Deployment name
export const deploymentName = deployment.metadata.name
