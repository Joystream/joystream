const cli = require('warthog/dist/cli/cli');
import { Command, flags } from '@oclif/command';

export default class DB extends Command {
  static description = 'Database management';

  static flags = {
    create: flags.boolean({ char: 'c', description: 'Create database' }),
    migrate: flags.boolean({ char: 'm', description: 'Run database migration' }),
    generatemigration: flags.string({ char: 'g', description: 'Generate database migration' }),
  };

  async run() {
    const { flags } = this.parse(DB);

    if (flags.create) {
      cli.run('db:create');
      this.exit(0);
    }
    if (flags.migrate) {
      cli.run('db:migrate');
      this.exit(0);
    }
    if (flags.generatemigration) {
      cli.run(`db:migrate:generate --name=${flags.generatemigration}`);
      this.exit(0);
    }
  }
}
