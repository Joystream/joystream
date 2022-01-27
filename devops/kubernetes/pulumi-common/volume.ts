import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

/**
 * This is an abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 * This class creates a Persistent Volume
 */
export class CustomPersistentVolume extends pulumi.ComponentResource {
  public readonly pvc: k8s.core.v1.PersistentVolumeClaim

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('volume:service:CustomPersistentVolume', name, {}, opts)

    const volumeLabels = { app: name }
    const pvcName = `${name}-pvc`

    this.pvc = new k8s.core.v1.PersistentVolumeClaim(
      pvcName,
      {
        metadata: {
          labels: volumeLabels,
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
  }
}

export interface ServiceDeploymentArgs {
  namespaceName: pulumi.Output<string>
  storage: Number
}
