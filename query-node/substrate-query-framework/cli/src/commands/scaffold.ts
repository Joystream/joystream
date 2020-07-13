import { Command } from '@oclif/command';
import * as fs from 'fs-extra';
import * as path from 'path';
import cli from 'cli-ux'
import { getTemplatePath } from '../utils/utils';

export default class Scaffold extends Command {
  static description = `Generates a directory layout for mappings and a sample schema file`;

  async run(): Promise<void> {
    cli.action.start('Scaffolding');
    
    await fs.ensureDir('mappings');
    await fs.ensureDir('bootstrap');
  
    await fs.copyFile(getTemplatePath('scaffold/.env'), path.join(process.cwd(), '.env'));
    await fs.copyFile(getTemplatePath('scaffold/schema.graphql'), path.join(process.cwd(), 'schema.graphql'));

    cli.action.stop();
    
  }
}
