import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import * as fs from 'fs'

export class configMapFromFile extends pulumi.ComponentResource {
  public readonly configName?: pulumi.Output<string>

  constructor(name: string, args: ConfigMapArgs, opts: pulumi.ComponentResourceOptions = {}) {
    super('pkg:query-node:configMap', name, {}, opts)

    this.configName = new k8s.core.v1.ConfigMap(
      name,
      {
        metadata: {
          namespace: args.namespaceName,
        },
        data: {
          'fileData': fs.readFileSync(args.filePath).toString(),
        },
      },
      opts
    ).metadata.apply((m) => m.name)
  }
}

export interface ConfigMapArgs {
  filePath: string
  namespaceName: pulumi.Output<string>
}
