import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { configMapFromFile } from './configMap'

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')
const isMinikube = config.getBoolean('isMinikube')
export let kubeconfig: pulumi.Output<any>
export let joystreamAppsImage: pulumi.Output<string>
let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})

  // Create image from local app
  // joystreamAppsImage = new docker.Image('joystream/apps', {
  //   build: {
  //     context: '../../../',
  //     dockerfile: '../../../apps.Dockerfile',
  //   },
  //   imageName: 'joystream/apps:latest',
  //   skipPush: true,
  // }).baseImageName
  // joystreamAppsImage = pulumi.interpolate`joystream/apps`
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('joystream-node-vpc', { numberOfAvailabilityZones: 2 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-my-cluster', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    desiredCapacity: 3,
    maxSize: 3,
    instanceType: 't2.large',
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

// const subkeyJob = new k8s.batch.v1.Job(
//   'subkey-job',
//   {
//     metadata: {
//       namespace: namespaceName,
//     },
//     spec: {
//       completions: 3,
//       backoffLimit: 0,
//       template: {
//         spec: {
//           containers: [
//             {
//               name: 'subkey-node',
//               image: 'parity/subkey:latest',
//               args: ['generate-node-key'],
//             },
//           ],
//           restartPolicy: 'Never',
//         },
//       },
//     },
//   },
//   { ...resourceOptions }
// )

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
            {
              name: 'subkey-node',
              image: 'parity/subkey:latest',
              command: ['/bin/sh', '-c'],
              args: [
                `subkey generate-node-key >> ${dataPath}/subkey 2>> ${dataPath}/subkey; echo '\n\n' >> ${dataPath}/subkey`,
              ],
              volumeMounts: [
                {
                  name: 'subkey-data',
                  mountPath: dataPath,
                },
              ],
            },
            {
              name: 'subkey-node-1',
              image: 'parity/subkey:latest',
              command: ['/bin/sh', '-c'],
              args: [`subkey generate-node-key >> ${dataPath}/subkey 2>> ${dataPath}/subkey`],
              volumeMounts: [
                {
                  name: 'subkey-data',
                  mountPath: dataPath,
                },
              ],
            },
            {
              name: 'busybox',
              image: 'busybox',
              command: ['/bin/sh', '-c'],
              args: [`cat ${dataPath}/subkey`],
              volumeMounts: [
                {
                  name: 'subkey-data',
                  mountPath: dataPath,
                },
              ],
            },
            {
              name: 'builder-node',
              image: 'joystream/node:latest',
              command: ['/bin/sh', '-c'],
              args: [
                '/joystream/chain-spec-builder generate -a 2 --chain-spec-path /builder-data/chainspec.json --deployment live --endowed 1 --keystore-path /builder-data/data >> /builder-data/seeds.txt',
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
              args: ['/scripts/json_modify.py', '--path', '/builder-data/chainspec.json', '--prefix', '8129'],
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
              ],
            },
          ],
          containers: [
            {
              name: 'joystream-node',
              image: 'joystream/node:latest',
              ports: [{ containerPort: 9944 }, { containerPort: 9933 }],
              args: ['--dev'],
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
      name: 'query-node',
    },
    spec: {
      type: 'NodePort',
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

// When "done", this will print the public IP.
export let serviceHostname: pulumi.Output<string>

if (isMinikube) {
  serviceHostname = service.spec.clusterIP
} else {
  serviceHostname = service.status.loadBalancer.ingress[0].hostname
}
