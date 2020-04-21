const cli = require('warthog/dist/cli/cli');
import { Command } from '@oclif/command';

export default class Init extends Command {
  static description = 'Initialize a new warthog project';

  async run() {
    cli.run('new');
  }
}
