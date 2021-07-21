import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { configMapFromFile } from './configMap'
import { CaddyServiceDeployment } from './caddy'
import { getSubkeyContainers, getValidatorContainers } from './utils'

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')
const isMinikube = config.getBoolean('isMinikube')
export let kubeconfig: pulumi.Output<any>
export let joystreamAppsImage: pulumi.Output<string>
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
// const ns = new k8s.core.v1.Namespace(name, {}, { provider: cluster.provider })
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

const jsonModifyConfig = new configMapFromFile(
  'json-modify-config',
  {
    filePath: 'json_modify.py',
    namespaceName: namespaceName,
  },
  resourceOptions
).configName

const dataPath = '/subkey-data'
const builderPath = '/builder-data'
const networkSuffix = config.get('networkSuffix') || '8129'
const chainSpecPath = `${builderPath}/chainspec-raw.json`
const numberOfValidators = config.getNumber('numberOfValidators') || 2

const subkeyContainers = getSubkeyContainers(numberOfValidators, dataPath)
const validatorContainers = getValidatorContainers(numberOfValidators, dataPath, builderPath, chainSpecPath)

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
          initContainers: [
            ...subkeyContainers,
            {
              name: 'builder-node',
              image: 'joystream/node:latest',
              command: ['/bin/sh', '-c'],
              args: [
                `/joystream/chain-spec-builder generate -a ${numberOfValidators} \
                --chain-spec-path ${builderPath}/chainspec.json --deployment live \
                --endowed 1 --keystore-path ${builderPath}/data >> ${builderPath}/seeds.txt`,
              ],
              volumeMounts: [
                {
                  name: 'builder-data',
                  mountPath: builderPath,
                },
              ],
            },
            {
              name: 'json-modify',
              image: 'python',
              command: ['python'],
              args: ['/scripts/json_modify.py', '--path', `${builderPath}/chainspec.json`, '--prefix', networkSuffix],
              volumeMounts: [
                {
                  mountPath: '/scripts/json_modify.py',
                  name: 'json-modify-script',
                  subPath: 'fileData',
                },
                {
                  name: 'builder-data',
                  mountPath: builderPath,
                },
                {
                  name: 'subkey-data',
                  mountPath: dataPath,
                },
              ],
            },
            {
              name: 'raw-chain-spec',
              image: 'joystream/node:latest',
              command: ['/bin/sh', '-c'],
              args: [`/joystream/node build-spec --chain ${builderPath}/chainspec.json --raw > ${chainSpecPath}`],
              volumeMounts: [
                {
                  name: 'builder-data',
                  mountPath: builderPath,
                },
              ],
            },
          ],
          containers: [
            ...validatorContainers,
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
                '--unsafe-rpc-external',
                '--unsafe-ws-external',
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
                  name: 'subkey-data',
                  mountPath: dataPath,
                },
                {
                  name: 'builder-data',
                  mountPath: builderPath,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'subkey-data',
              emptyDir: {},
            },
            {
              name: 'builder-data',
              emptyDir: {},
            },
            {
              name: 'json-modify-script',
              configMap: {
                name: jsonModifyConfig,
              },
            },
          ],
        },
      },
    },
  },
  { ...resourceOptions }
)

// Export the Deployment name
export const deploymentName = deployment.metadata.name

// Create a LoadBalancer Service for the NGINX Deployment
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
        { name: 'port-1', port: 9944, targetPort: 'rpc-9944' },
        { name: 'port-2', port: 9933, targetPort: 'rpc-9933' },
        { name: 'port-3', port: 30333, targetPort: 'rpc-30333' },
      ],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name

const lbReady = config.get('isLoadBalancerReady') === 'true'
const caddy = new CaddyServiceDeployment(
  'caddy-proxy',
  { lbReady, namespaceName: namespaceName, isMinikube },
  resourceOptions
)

export const endpoint1 = caddy.primaryEndpoint
export const endpoint2 = caddy.secondaryEndpoint
