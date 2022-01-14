import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { configMapFromFile } from './configMap'
import { CaddyServiceDeployment, getProvider } from 'pulumi-common'
import { getSubkeyContainers } from './utils'
import { ValidatorServiceDeployment } from './validator'
import { NFSServiceDeployment } from './nfsVolume'

export = async () => {
  const config = new pulumi.Config()

  const provider: k8s.Provider = (await getProvider(config)).provider
  const useLocalProvider: boolean = (await getProvider(config)).isLocalProvider

  const resourceOptions = { provider: provider }

  const name = 'node-network'

  // Create a Kubernetes Namespace
  const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)
  const namespaceName = ns.metadata.name

  const appLabels = { appClass: name }

  const networkSuffix = config.get('networkSuffix') || '8129'
  const numberOfValidators = config.getNumber('numberOfValidators') || 1
  const chainDataPath = '/chain-data'
  const chainSpecPath = `${chainDataPath}/chainspec-raw.json`
  const nodeImage = config.get('nodeImage') || 'joystream/node:latest'
  const encryptKey = config.get('encryptionKey') || '1234'

  const subkeyContainers = getSubkeyContainers(numberOfValidators, chainDataPath)
  let pvcClaimName: pulumi.Output<any>

  const nfsVolume = new NFSServiceDeployment('nfs-server', { namespace: namespaceName }, resourceOptions)
  pvcClaimName = nfsVolume.pvc.metadata.apply((m) => m.name)

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
                image: nodeImage,
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
                image: nodeImage,
                command: ['/bin/sh', '-c'],
                args: [`/joystream/node build-spec --chain ${chainDataPath}/chainspec.json --raw > ${chainSpecPath}`],
                volumeMounts: [
                  {
                    name: 'config-data',
                    mountPath: chainDataPath,
                  },
                ],
              },
              {
                name: '7z',
                image: 'danielwhatmuff/7z-docker',
                command: ['/bin/sh', '-c'],
                args: [`7z a -p${encryptKey} ${chainDataPath}/chain-data.7z ${chainDataPath}/*`],
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
      { namespace: namespaceName, index: i, chainSpecPath, dataPath: chainDataPath, pvc: pvcClaimName, nodeImage },
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
                image: nodeImage,
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
  const deploymentName = deployment.metadata.name

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
        type: useLocalProvider ? 'NodePort' : 'ClusterIP',
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
  const serviceName = service.metadata.name

  const lbReady = config.get('isLoadBalancerReady') === 'true'

  const caddyEndpoints = [
    `/ws-rpc {
  reverse_proxy node-network:9944
}`,
    `/http-rpc {
  reverse_proxy node-network:9933
}`,
  ]

  let endpoint1
  let endpoint2

  if (!useLocalProvider) {
    const caddy = new CaddyServiceDeployment(
      'caddy-proxy',
      { lbReady, namespaceName: namespaceName, isMinikube: useLocalProvider, caddyEndpoints },
      resourceOptions
    )

    endpoint1 = pulumi.interpolate`${caddy.primaryEndpoint}`
    endpoint2 = pulumi.interpolate`${caddy.secondaryEndpoint}`
  }

  return {
    namespaceName,
    serviceName,
    deploymentName,
    endpoint1,
    endpoint2,
  }
}
