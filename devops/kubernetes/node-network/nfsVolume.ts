import * as k8s from '@pulumi/kubernetes'
import * as k8stypes from '@pulumi/kubernetes/types/input'
import * as pulumi from '@pulumi/pulumi'

/**
 * NFSServiceDeployment is an abstraction uses the cloud resources to create a PVC
 * which is then used by an NFS container, enabling users to then use this NFS server
 * as a shared file system without depending on creating custom cloud resources
 */
export class NFSServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service
  public readonly pvc: k8s.core.v1.PersistentVolumeClaim

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('k8sjs:service:NFSServiceDeployment', name, {}, opts)

    const nfsLabels = { role: 'nfs-server' }
    const claimName = 'pvcfornfs'

    // Deploys a cloud block storage which will be used as base storage for NFS server
    const pvcNFS = new k8s.core.v1.PersistentVolumeClaim(
      claimName,
      {
        metadata: {
          labels: nfsLabels,
          namespace: args.namespace,
          name: claimName,
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: {
            requests: {
              storage: `1Gi`,
            },
          },
        },
      },
      { parent: this }
    )

    const container: k8stypes.core.v1.Container = {
      name: 'nfs-server',
      image: 'gcr.io/google_containers/volume-nfs:0.8',
      ports: [
        { name: 'nfs', containerPort: 2049 },
        { name: 'mountd', containerPort: 20048 },
        { name: 'rpcbind', containerPort: 111 },
      ],
      command: ['/bin/sh', '-c'],
      args: ['chmod 777 /exports && /usr/local/bin/run_nfs.sh /exports'],
      securityContext: { 'privileged': true },
      volumeMounts: [
        {
          name: 'nfsstore',
          mountPath: '/exports',
        },
      ],
    }

    this.deployment = new k8s.apps.v1.Deployment(
      `nfs-server`,
      {
        metadata: {
          namespace: args.namespace,
          labels: nfsLabels,
          name: 'nfs-server',
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: nfsLabels },
          template: {
            metadata: {
              labels: nfsLabels,
            },
            spec: {
              containers: [container],
              volumes: [
                {
                  name: 'nfsstore',
                  persistentVolumeClaim: {
                    claimName,
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
      'nfs-server',
      {
        metadata: {
          namespace: args.namespace,
          name: 'nfs-server',
        },
        spec: {
          ports: [
            { name: 'nfs', port: 2049 },
            { name: 'mountd', port: 20048 },
            { name: 'rpcbind', port: 111 },
          ],
          selector: nfsLabels,
        },
      },
      { parent: this }
    )

    const ip = this.service.spec.apply((v) => v.clusterIP)

    const pv = new k8s.core.v1.PersistentVolume(
      `${name}-pv`,
      {
        metadata: {
          labels: nfsLabels,
          namespace: args.namespace,
          name: `${name}-pvc`,
        },
        spec: {
          accessModes: ['ReadWriteMany'],
          capacity: {
            storage: `1Gi`,
          },
          nfs: {
            server: ip, //pulumi.interpolate`nfs-server.${namespaceName}.svc.cluster.local`,
            path: '/',
          },
        },
      },
      { parent: this, dependsOn: this.service }
    )

    this.pvc = new k8s.core.v1.PersistentVolumeClaim(
      `${name}-pvc`,
      {
        metadata: {
          namespace: args.namespace,
          name: `${name}-pvc`,
        },
        spec: {
          accessModes: ['ReadWriteMany'],
          resources: {
            requests: {
              storage: `1Gi`,
            },
          },
          storageClassName: '',
          selector: { matchLabels: nfsLabels },
        },
      },
      { parent: this, dependsOn: pv }
    )
  }
}

export interface ServiceDeploymentArgs {
  namespace: pulumi.Output<string>
}
