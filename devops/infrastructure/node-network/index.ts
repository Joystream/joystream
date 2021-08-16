import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { configMapFromFile } from './configMap'
import { CaddyServiceDeployment } from 'pulumi-common'
import { getSubkeyContainers } from './utils'
import { ValidatorServiceDeployment } from './validator'
import { NFSServiceDeployment } from './nfsVolume'
// const { exec } = require('child_process')

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')
const isMinikube = config.getBoolean('isMinikube')

export let kubeconfig: pulumi.Output<any>

let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('joystream-node-vpc', { numberOfAvailabilityZones: 2 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-node-network', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    desiredCapacity: 2,
    maxSize: 2,
    instanceType: 't2.medium',
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig
}

const resourceOptions = { provider: provider }

const name = 'node-network'

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

const networkSuffix = config.get('networkSuffix') || '8129'
const numberOfValidators = config.getNumber('numberOfValidators') || 1
const chainDataPath = '/chain-data'
const chainSpecPath = `${chainDataPath}/chainspec-raw.json`

const subkeyContainers = getSubkeyContainers(numberOfValidators, chainDataPath)
let pvcClaimName: pulumi.Output<any>

if (isMinikube) {
  const pvc = new k8s.core.v1.PersistentVolumeClaim(
    `${name}-pvc`,
    {
      metadata: {
        labels: appLabels,
        namespace: namespaceName,
        name: `${name}-pvc`,
      },
      spec: {
        accessModes: ['ReadWriteMany'],
        resources: {
          requests: {
            storage: `1Gi`,
          },
        },
      },
    },
    resourceOptions
  )

  const pv = new k8s.core.v1.PersistentVolume(`${name}-pv`, {
    metadata: {
      labels: { ...appLabels, type: 'local' },
      namespace: namespaceName,
      name: `${name}-pv`,
    },
    spec: {
      accessModes: ['ReadWriteMany'],
      capacity: {
        storage: `1Gi`,
      },
      hostPath: {
        path: '/mnt/data/',
      },
    },
  })
  pvcClaimName = pvc.metadata.apply((m) => m.name)
} else {
  const nfsVolume = new NFSServiceDeployment('nfs-server', { namespace: namespaceName }, resourceOptions)
  pvcClaimName = nfsVolume.pvc.metadata.apply((m) => m.name)
}

const jsonModifyConfig = new configMapFromFile(
  'json-modify-config',
  {
    filePath: 'json_modify.py',
    namespaceName: namespaceName,
  },
  resourceOptions
).configName

const chainDataPrepareJob = new k8s.batch.v1.Job(
  'chain-data',
  {
    metadata: {
      namespace: namespaceName,
    },
    spec: {
      backoffLimit: 0,
      template: {
        spec: {
          containers: [
            ...subkeyContainers,
            {
              name: 'builder-node',
              image: 'joystream/node:latest',
              command: ['/bin/sh', '-c'],
              args: [
                `/joystream/chain-spec-builder generate -a ${numberOfValidators} \
                --chain-spec-path ${chainDataPath}/chainspec.json --deployment live \
                --endowed 1 --keystore-path ${chainDataPath}/data > ${chainDataPath}/seeds.txt`,
              ],
              volumeMounts: [
                {
                  name: 'config-data',
                  mountPath: chainDataPath,
                },
              ],
            },
            {
              name: 'json-modify',
              image: 'python',
              command: ['python'],
              args: [
                '/scripts/json_modify.py',
                '--path',
                `${chainDataPath}`,
                '--prefix',
                networkSuffix,
                '--validators',
                `${numberOfValidators}`,
              ],
              volumeMounts: [
                {
                  mountPath: '/scripts/json_modify.py',
                  name: 'json-modify-script',
                  subPath: 'fileData',
                },
                {
                  name: 'config-data',
                  mountPath: chainDataPath,
                },
              ],
            },
            {
              name: 'raw-chain-spec',
              image: 'joystream/node:latest',
              command: ['/bin/sh', '-c'],
              args: [`/joystream/node build-spec --chain ${chainDataPath}/chainspec.json --raw > ${chainSpecPath}`],
              volumeMounts: [
                {
                  name: 'config-data',
                  mountPath: chainDataPath,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'json-modify-script',
              configMap: {
                name: jsonModifyConfig,
              },
            },
            {
              name: 'config-data',
              persistentVolumeClaim: {
                claimName: pvcClaimName,
              },
            },
          ],
          restartPolicy: 'Never',
        },
      },
    },
  },
  { ...resourceOptions }
)

// Create N validator service deployments
const validators = []

for (let i = 1; i <= numberOfValidators; i++) {
  const validator = new ValidatorServiceDeployment(
    `node-${i}`,
    { namespace: namespaceName, index: i, chainSpecPath, dataPath: chainDataPath, pvc: pvcClaimName },
    { ...resourceOptions, dependsOn: chainDataPrepareJob }
  )
  validators.push(validator)
}

const deployment = new k8s.apps.v1.Deployment(
  `rpc-node`,
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
          initContainers: [],
          containers: [
            {
              name: 'rpc-node',
              image: 'joystream/node:latest',
              ports: [
                { name: 'rpc-9944', containerPort: 9944 },
                { name: 'rpc-9933', containerPort: 9933 },
                { name: 'rpc-30333', containerPort: 30333 },
              ],
              args: [
                '--chain',
                chainSpecPath,
                '--ws-external',
                '--rpc-cors',
                'all',
                '--pruning',
                'archive',
                '--ws-max-connections',
                '512',
                '--telemetry-url',
                'wss://telemetry.joystream.org/submit/ 0',
                '--telemetry-url',
                'wss://telemetry.polkadot.io/submit/ 0',
              ],
              volumeMounts: [
                {
                  name: 'config-data',
                  mountPath: chainDataPath,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'config-data',
              persistentVolumeClaim: {
                claimName: pvcClaimName,
              },
            },
          ],
        },
      },
    },
  },
  { ...resourceOptions, dependsOn: validators }
)

// Export the Deployment name
export const deploymentName = deployment.metadata.name

// Create a Service for the RPC Node
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
      name: 'node-network',
    },
    spec: {
      ports: [
        { name: 'port-1', port: 9944 },
        { name: 'port-2', port: 9933 },
      ],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name

const lbReady = config.get('isLoadBalancerReady') === 'true'

const caddyEndpoints = [
  `/ws-rpc {
  reverse_proxy node-network:9944
}`,
  `/http-rpc {
  reverse_proxy node-network:9933
}`,
]

const caddy = new CaddyServiceDeployment(
  'caddy-proxy',
  { lbReady, namespaceName: namespaceName, isMinikube, caddyEndpoints },
  resourceOptions
)

export const endpoint1 = caddy.primaryEndpoint
export const endpoint2 = caddy.secondaryEndpoint
