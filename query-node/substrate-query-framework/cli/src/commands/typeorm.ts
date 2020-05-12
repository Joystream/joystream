import { Command, flags } from '@oclif/command';

import { resetLastProcessedEvent } from '../helpers/db';

export default class Typeorm extends Command {
  static description = 'Typeorm commands';

  static flags = {
    reset: flags.boolean({ char: 'r', default: true, description: 'Reset last processed event to genesis' })
  };

  async run() {
    const { flags } = this.parse(Typeorm);

    if (flags.reset) {
      this.log('Resetting the last processed event...');
      await resetLastProcessedEvent();
      this.log('Done...');
      this.exit(0);
    }
  }
}
