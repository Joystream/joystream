const cli = require('warthog/dist/cli/cli');
import { Command } from '@oclif/command';

export default class Codegen extends Command {
  static description =
    'Generate graphql schema, ormconfig, bindings. Execute warthog codegen command';

  async run() {
    cli.run('codegen');
  }
}
