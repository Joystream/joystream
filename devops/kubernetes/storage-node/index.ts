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
const queryNodeHost = config.require('queryNodeHost')
const workerId = config.get('workerId') || '0'
const accountURI = config.get('accountURI') || '//Alice'
const lbReady = config.get('isLoadBalancerReady') === 'true'
const configColossusImage = config.get('colossusImage') || `joystream/colossus:latest`
const colossusPort = parseInt(config.get('colossusPort') || '3333')
const storage = parseInt(config.get('storage') || '40')
const isMinikube = config.getBoolean('isMinikube')

let additionalParams: string[] | pulumi.Input<string>[] = []

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

const keyFile = config.require('keyFile')
const keyConfigName = new configMapFromFile(
  'key-config',
  {
    filePath: keyFile,
    namespaceName: namespaceName,
  },
  resourceOptions
).configName

const remoteKeyFilePath = '/joystream/key-file.json'
additionalParams = ['--key-file', remoteKeyFilePath]

const passphrase = config.get('passphrase')
if (passphrase) {
  additionalParams.push('--password', passphrase)
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
                  name: 'QUERY_NODE_HOST',
                  value: queryNodeHost,
                },
                {
                  name: 'WORKER_ID',
                  value: workerId,
                },
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
                {
                  mountPath: remoteKeyFilePath,
                  name: 'keyfile-volume',
                  subPath: 'fileData',
                },
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
            {
              name: 'keyfile-volume',
              configMap: {
                name: keyConfigName,
              },
            },
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
