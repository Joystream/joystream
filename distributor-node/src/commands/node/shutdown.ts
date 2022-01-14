import NodeCommandBase from '../../command-base/node'

export default class NodeShutdownCommand extends NodeCommandBase {
  static description = `Send an api request to shutdown given distributor node.`

  static flags = {
    ...NodeCommandBase.flags,
  }

  protected reqUrl(): string {
    return '/api/v1/shutdown'
  }
}
