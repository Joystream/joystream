import * as fs from 'fs';
const cli = require('warthog/dist/cli/cli');
import { Command } from '@oclif/command';

export default class New extends Command {
  static description = 'Create a new warthog project';

  static args = [
    {
      name: 'project_name',
    },
  ];

  async run() {
    const { args } = this.parse(New);
    const project_name = args.project_name;

    if (!project_name) this.error('Please provide project name');
    if (!fs.existsSync(project_name)) {
      fs.mkdirSync(project_name);
    }

    process.chdir(project_name);
    cli.run(`new ${project_name}`);
  }
}
