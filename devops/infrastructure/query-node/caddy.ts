import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import * as dns from 'dns'

/**
 * ServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 */
export class CaddyServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service
  public readonly hostname?: pulumi.Output<string>
  public readonly primaryEndpoint?: pulumi.Output<string>
  public readonly secondaryEndpoint?: pulumi.Output<string>

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('k8sjs:service:ServiceDeployment', name, {}, opts)

    const labels = { app: name }
    let volumes: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.Volume>[]> = []
    let caddyVolumeMounts: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.VolumeMount>[]> = []

    async function lookupPromise(url: string): Promise<dns.LookupAddress[]> {
      return new Promise((resolve, reject) => {
        dns.lookup(url, { all: true }, (err: any, addresses: dns.LookupAddress[]) => {
          if (err) reject(err)
          resolve(addresses)
        })
      })
    }

    this.service = new k8s.core.v1.Service(
      name,
      {
        metadata: {
          name: name,
          namespace: args.namespaceName,
          labels: labels,
        },
        spec: {
          type: 'LoadBalancer',
          ports: [
            { name: 'http', port: 80 },
            { name: 'https', port: 443 },
          ],
          selector: labels,
        },
      },
      { parent: this }
    )

    this.hostname = this.service.status.loadBalancer.ingress[0].hostname

    if (args.lbReady) {
      let caddyConfig: pulumi.Output<string>
      const lbIps: pulumi.Output<dns.LookupAddress[]> = this.hostname.apply((dnsName) => {
        return lookupPromise(dnsName)
      })

      function getProxyString(ipAddress: pulumi.Output<string>) {
        return pulumi.interpolate`${ipAddress}.nip.io/indexer/* {
          uri strip_prefix /indexer
          reverse_proxy query-node:4000
        }

        ${ipAddress}.nip.io/graphql/* {
          uri strip_prefix /graphql
          reverse_proxy query-node:8081
        }
        `
      }

      caddyConfig = pulumi.interpolate`${getProxyString(lbIps[0].address)}
        ${getProxyString(lbIps[1].address)}`

      this.primaryEndpoint = pulumi.interpolate`${lbIps[0].address}.nip.io`
      this.secondaryEndpoint = pulumi.interpolate`${lbIps[1].address}.nip.io`

      const keyConfig = new k8s.core.v1.ConfigMap(
        name,
        {
          metadata: { namespace: args.namespaceName, labels: labels },
          data: { 'fileData': caddyConfig },
        },
        { parent: this }
      )
      const keyConfigName = keyConfig.metadata.apply((m) => m.name)

      caddyVolumeMounts.push({
        mountPath: '/etc/caddy/Caddyfile',
        name: 'caddy-volume',
        subPath: 'fileData',
      })
      volumes.push({
        name: 'caddy-volume',
        configMap: {
          name: keyConfigName,
        },
      })
    }

    this.deployment = new k8s.apps.v1.Deployment(
      name,
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
                  name: 'caddy',
                  image: 'caddy',
                  ports: [
                    { name: 'caddy-http', containerPort: 80 },
                    { name: 'caddy-https', containerPort: 443 },
                  ],
                  volumeMounts: caddyVolumeMounts,
                },
              ],
              volumes,
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
  lbReady?: boolean
  isMinikube?: boolean
}
