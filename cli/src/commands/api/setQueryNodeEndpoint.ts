import chalk from 'chalk'
import ApiCommandBase from '../../base/ApiCommandBase'
import ExitCodes from '../../ExitCodes'

type ApiSetQueryNodeEndpointArgs = { endpoint: string }

export default class ApiSetQueryNodeEndpoint extends ApiCommandBase {
  protected requiresApiConnection = false

  static description = 'Set query node endpoint'
  static args = [
    {
      name: 'endpoint',
      required: false,
      description: 'Query node endpoint for the CLI to use',
    },
  ]

  async run(): Promise<void> {
    const { endpoint }: ApiSetQueryNodeEndpointArgs = this.parse(ApiSetQueryNodeEndpoint)
      .args as ApiSetQueryNodeEndpointArgs
    let newEndpoint: string | null = null
    if (endpoint) {
      if (!this.isQueryNodeUriValid(endpoint)) {
        this.error('Provided endpoint seems to be incorrect!', { exit: ExitCodes.InvalidInput })
      }
      newEndpoint = endpoint
    } else {
      newEndpoint = await this.promptForQueryNodeUri()
    }
    await this.setPreservedState({ queryNodeUri: newEndpoint })
    this.log(
      chalk.greenBright('Query node endpoint successfuly changed! New endpoint: ') + chalk.magentaBright(newEndpoint)
    )
  }
}
