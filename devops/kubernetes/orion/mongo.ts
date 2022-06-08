import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

/**
 * ServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 * This class delpoys a Mongo DB instance on a Persistent Volume
 */
export class MongoDBServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('mongodb:service:PostgresServiceDeployment', name, {}, opts)

    const databaseLabels = { app: name }
    const pvcName = `${name}-pvc`

    const pvc = new k8s.core.v1.PersistentVolumeClaim(
      pvcName,
      {
        metadata: {
          labels: databaseLabels,
          namespace: args.namespaceName,
          name: pvcName,
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: {
            requests: {
              storage: `${args.storage}Gi`,
            },
          },
        },
      },
      { parent: this }
    )

    this.deployment = new k8s.apps.v1.Deployment(
      name,
      {
        metadata: {
          namespace: args.namespaceName,
          labels: databaseLabels,
        },
        spec: {
          selector: { matchLabels: databaseLabels },
          template: {
            metadata: { labels: databaseLabels },
            spec: {
              containers: [
                {
                  name: 'mongo-db',
                  image: 'library/mongo:4.4',
                  volumeMounts: [
                    {
                      name: 'mongo-data',
                      mountPath: '/data/db',
                      subPath: 'mongo',
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'mongo-data',
                  persistentVolumeClaim: {
                    claimName: pvcName,
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
          namespace: args.namespaceName,
          labels: this.deployment.metadata.labels,
          name: name,
        },
        spec: {
          ports: [{ port: 27017 }],
          selector: this.deployment.spec.template.metadata.labels,
        },
      },
      { parent: this }
    )
  }
}

export interface ServiceDeploymentArgs {
  namespaceName: pulumi.Output<string>
  storage: Number
}
