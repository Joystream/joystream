import * as k8s from '@pulumi/kubernetes'
import * as k8stypes from '@pulumi/kubernetes/types/input'
import * as pulumi from '@pulumi/pulumi'

/**
 * ValidatorServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 */
export class ValidatorServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service
  public readonly ipAddress?: pulumi.Output<string>

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('k8sjs:service:ValidatorServiceDeployment', name, {}, opts)

    const labels = { app: name }
    const container: k8stypes.core.v1.Container = {
      name: `joystream-node-${args.index}`,
      image: 'joystream/node:latest',
      args: [
        '--chain',
        args.chainSpecPath,
        '--pruning',
        'archive',
        '--node-key-file',
        `${args.dataPath}/privatekey${args.index}`,
        '--keystore-path',
        `${args.dataPath}/data/auth-${args.index - 1}`,
        '--validator',
        '--log',
        'runtime,txpool,transaction-pool,trace=sync',
      ],
      volumeMounts: [
        {
          name: 'config-data',
          mountPath: args.dataPath,
        },
      ],
    }
    this.deployment = new k8s.apps.v1.Deployment(
      name,
      {
        metadata: {
          namespace: args.namespace,
          labels: labels,
        },
        spec: {
          selector: { matchLabels: labels },
          replicas: 1,
          template: {
            metadata: { labels: labels },
            spec: {
              containers: [container],
              volumes: [
                {
                  name: 'config-data',
                  persistentVolumeClaim: {
                    claimName: args.pvc,
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this }
    )

    this.service = new k8s.core.v1.Service(
      name,
      {
        metadata: {
          name: name,
          namespace: args.namespace,
          labels: this.deployment.metadata.labels,
        },
        spec: {
          ports: [{ name: 'port-1', port: 30333 }],
          selector: this.deployment.spec.template.metadata.labels,
        },
      },
      { parent: this }
    )
  }
}

export interface ServiceDeploymentArgs {
  namespace: pulumi.Output<string>
  index: number
  chainSpecPath: string
  dataPath: string
  pvc: string
}
