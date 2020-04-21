import { Command, flags } from '@oclif/command';

import { initConfig } from '../helpers/initConfig';
import { createEntities } from '../helpers/createEntities';

export default class Typeorm extends Command {
  static description = 'Typeorm commands';

  static args = [{ name: 'generate', options: ['generate'] }];
  static flags = {
    env: flags.string({ char: 'e', description: 'dotenv file path', required: true })
  };
  async run() {
    initConfig();
    if (!process.env.TYPEORM_CLI)
      this.error('typeorm-model-generator path is not defined in .env file');

    createEntities();
  }
}
