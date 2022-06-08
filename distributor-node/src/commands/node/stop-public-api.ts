import NodeCommandBase from '../../command-base/node'

export default class NodeStopPublicApiCommand extends NodeCommandBase {
  static description = `Send an api request to stop public api of given distributor node.`

  static flags = {
    ...NodeCommandBase.flags,
  }

  protected reqUrl(): string {
    return '/api/v1/stop-api'
  }
}
