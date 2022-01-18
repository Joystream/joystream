import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

/**
 * ServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 */
export class NginxServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service
  public readonly hostname?: pulumi.Output<string>

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('nginx:service:NginxServiceDeployment', name, {}, opts)

    const labels = { app: name }

    const nginxConfig = `events {}
    http {
      server {
        listen 80;
        ${args.nginxConfig}
    }
  }`
    const keyConfig = new k8s.core.v1.ConfigMap(
      name,
      {
        metadata: { namespace: args.namespaceName, labels: labels },
        data: { 'fileData': nginxConfig },
      },
      { parent: this }
    )
    const keyConfigName = keyConfig.metadata.apply((m) => m.name)
    this.deployment = new k8s.apps.v1.Deployment(
      'nginx',
      {
        metadata: { namespace: args.namespaceName, labels: labels },
        spec: {
          selector: { matchLabels: labels },
          replicas: 1,
          template: {
            metadata: { labels: labels },
            spec: {
              containers: [
                {
                  name: 'nginx',
                  image: 'nginx:1.15-alpine',
                  volumeMounts: [
                    {
                      mountPath: '/etc/nginx/nginx.conf',
                      name: 'nginx-volume',
                      subPath: 'fileData',
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'nginx-volume',
                  configMap: {
                    name: keyConfigName,
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
      'nginx',
      {
        metadata: {
          namespace: args.namespaceName,
          labels: labels,
          annotations: {
            'service.beta.kubernetes.io/aws-load-balancer-backend-protocol': 'http',
            'service.beta.kubernetes.io/aws-load-balancer-ssl-cert': args.acmCertificateARN,
            'service.beta.kubernetes.io/aws-load-balancer-ssl-ports': 'https',
          },
        },
        spec: {
          type: 'LoadBalancer',
          ports: [
            { name: 'http', port: 80, targetPort: 80 },
            { name: 'https', port: 443, targetPort: 80 },
          ],
          selector: labels,
        },
      },
      { parent: this }
    )
    this.hostname = this.service.status.loadBalancer.ingress[0].hostname
  }
}

export interface ServiceDeploymentArgs {
  namespaceName: pulumi.Output<string>
  // location config for nginx
  nginxConfig: string
  acmCertificateARN: string
}
