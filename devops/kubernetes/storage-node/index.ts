import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as docker from '@pulumi/docker'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { CaddyServiceDeployment, configMapFromFile } from 'pulumi-common'
import * as fs from 'fs'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const name = 'storage-node'

const wsProviderEndpointURI = config.require('wsProviderEndpointURI')
const queryNodeHost = config.require('queryNodeEndpoint')
const workerId = config.require('workerId')
const accountURI = config.get('accountURI')
const keyFile = config.get('keyFile')
const lbReady = config.get('isLoadBalancerReady') === 'true'
const configColossusImage = config.get('colossusImage') || `joystream/colossus:latest`
const colossusPort = parseInt(config.get('colossusPort') || '3333')
const storage = parseInt(config.get('storage') || '40')
const isMinikube = config.getBoolean('isMinikube')

const additionalVolumes: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.Volume>[]> = []
const additionalVolumeMounts: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.VolumeMount>[]> = []

if (!accountURI && !keyFile) {
  throw new Error('Must specify either Key file or Account URI')
}

const additionalParams: string[] | pulumi.Input<string>[] = []

export let kubeconfig: pulumi.Output<any>
export let colossusImage: pulumi.Output<string> = pulumi.interpolate`${configColossusImage}`
let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('storage-node-vpc', { numberOfAvailabilityZones: 2, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-storage-node', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    instanceType: 't2.medium',
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig

  // Create a repository
  const repo = new awsx.ecr.Repository('colossus-image')

  // Build an image and publish it to our ECR repository.
  colossusImage = repo.buildAndPushImage({
    context: './docker_dummy',
    dockerfile: './docker_dummy/Dockerfile',
    args: { SOURCE_IMAGE: colossusImage! },
  })
}

const resourceOptions = { provider: provider }

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

if (keyFile) {
  const keyConfigName = new configMapFromFile(
    'key-config',
    {
      filePath: keyFile,
      namespaceName: namespaceName,
    },
    resourceOptions
  ).configName

  const remoteKeyFilePath = '/joystream/key-file.json'
  additionalParams.push(`--keyFile=${remoteKeyFilePath}`)

  const passphrase = config.get('passphrase')
  if (passphrase) {
    additionalParams.push(`--password=${passphrase}`)
  }

  additionalVolumes.push({
    name: 'keyfile-volume',
    configMap: {
      name: keyConfigName,
    },
  })

  additionalVolumeMounts.push({
    mountPath: remoteKeyFilePath,
    name: 'keyfile-volume',
    subPath: 'fileData',
  })
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
          containers: [
            {
              name: 'colossus',
              image: colossusImage,
              imagePullPolicy: 'IfNotPresent',
              workingDir: '/joystream/storage-node',
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
                {
                  name: 'COLOSSUS_PORT',
                  value: `${colossusPort}`,
                },
                {
                  name: 'QUERY_NODE_ENDPOINT',
                  value: queryNodeHost,
                },
                {
                  name: 'WORKER_ID',
                  value: workerId,
                },
                // ACCOUNT_URI takes precedence over keyFile
                {
                  name: 'ACCOUNT_URI',
                  value: accountURI,
                },
              ],
              volumeMounts: [
                {
                  name: 'colossus-data',
                  mountPath: '/data',
                  subPath: 'data',
                },
                {
                  name: 'colossus-data',
                  mountPath: '/keystore',
                  subPath: 'keystore',
                },
                ...additionalVolumeMounts,
              ],
              command: ['yarn'],
              args: [
                'storage-node',
                'server',
                '--worker',
                workerId,
                '--port',
                `${colossusPort}`,
                '--uploads=/data',
                '--sync',
                '--syncInterval=1',
                '--queryNodeEndpoint',
                queryNodeHost,
                '--apiUrl',
                wsProviderEndpointURI,
                ...additionalParams,
              ],
              ports: [{ containerPort: colossusPort }],
            },
          ],
          volumes: [
            {
              name: 'colossus-data',
              persistentVolumeClaim: {
                claimName: `${name}-pvc`,
              },
            },
            ...additionalVolumes,
          ],
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
      type: isMinikube ? 'NodePort' : 'ClusterIP',
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

const caddyEndpoints = [
  ` {
    reverse_proxy storage-node:${colossusPort}
}`,
]

export let endpoint1: pulumi.Output<string> = pulumi.interpolate``
export let endpoint2: pulumi.Output<string> = pulumi.interpolate``

if (!isMinikube) {
  const caddy = new CaddyServiceDeployment(
    'caddy-proxy',
    { lbReady, namespaceName: namespaceName, caddyEndpoints },
    resourceOptions
  )

  endpoint1 = pulumi.interpolate`${caddy.primaryEndpoint}`
  endpoint2 = pulumi.interpolate`${caddy.secondaryEndpoint}`
}
