import * as fs from 'fs';
import * as path from 'path';
const { exec } = require('child_process');
import { Command, flags } from '@oclif/command';

export default class Typeorm extends Command {
  static description = 'Typeorm commands';
  static typeormModelGenerator = 'typeorm-model-generator';

  static args = [{ name: 'generate', options: ['generate'] }];
  static flags = {
    ormconfig: flags.string({
      char: 'c',
      description: 'ormconfig.json file',
      required: true,
      default: './ormconfig.json',
    }),
    config: flags.string({ char: 'c', default: 'default', description: 'Typeorm config name' }),
    output: flags.string({ char: 'o', description: 'Generated entity path', default: '.' }),
  };

  async run() {
    const { flags } = this.parse(Typeorm);

    // Get ormconfig.json file path
    const configFilePath = path.resolve(process.cwd(), flags.ormconfig);
    // Read content of ormconfig.json file
    const configData = fs.readFileSync(configFilePath, 'utf8');

    if (configData.length <= 1) this.error('Empty config file');

    let configs;
    try {
      configs = JSON.parse(configData);
    } catch (error) {
      this.error('Invalid JSON data');
    }

    // Find config by name
    const config = configs.find((c: any) => c.name === flags.config);
    if (typeof config !== 'object') this.error('Not an object');

    const command = [
      Typeorm.typeormModelGenerator,
      `-h ${config.host}`,
      `-d ${config.database}`,
      `-e ${config.type}`,
      `-o ${flags.output}`,
      `-u ${config.username}`,
      `-p ${config.password}`,
    ].join(' ');

    exec(command, function (error: any, stdout: any, stderr: any) {
      // command output is in stdout
      console.log(stdout, stderr);
      if (error) console.log(error);
    });
  }
}
