import NodeCommandBase from '../../command-base/node'

export default class NodeStartPublicApiCommand extends NodeCommandBase {
  static description = `Send an api request to start public api of given distributor node.`

  static flags = {
    ...NodeCommandBase.flags,
  }

  protected reqUrl(): string {
    return '/api/v1/start-api'
  }
}
