import { Command } from '@oclif/command';
import * as fs from 'fs-extra';
import * as path from 'path';
import cli from 'cli-ux';
import { getTemplatePath } from '../utils/utils';
import Mustache = require('mustache');

export default class Scaffold extends Command {
  static description = `Starter kit: generates a directory layout and a sample schema file`;

  async run(): Promise<void> {
    await fs.writeFile(path.join(process.cwd(), '.env'), await this.promptDotEnv());
    this.log('Your settings have been saved to .env, feel free to edit');

    cli.action.start('Scaffolding');

    await fs.ensureDir('mappings');
    await fs.ensureDir('bootstrap');

    await fs.copyFile(getTemplatePath('scaffold/schema.graphql'), path.join(process.cwd(), 'schema.graphql'));

    cli.action.stop();
  }

  async promptDotEnv(): Promise<string> {
    const projectName = (await cli.prompt('Enter your project name', { required: true })) as string;
    const wsProviderUrl = (await cli.prompt('Substrate WS provider endpoint', {
      default: 'ws://localhost:9944',
    })) as string;

    const dbName = (await cli.prompt('Database name', { default: projectName })) as string;
    const dbHost = (await cli.prompt('Database host', { default: 'localhost' })) as string;
    const dbPort = (await cli.prompt('Database port', { default: '5432' })) as string;
    const dbUser = (await cli.prompt('Database user', { default: 'postgres' })) as string;
    const dbPassword = (await cli.prompt('Database user password', { type: 'mask', default: 'postgres' })) as string;

    const appPort = (await cli.prompt('GraphQL server port', { default: '4000' })) as string;

    const template = await fs.readFile(getTemplatePath('scaffold/.env'), 'utf-8');

    return Mustache.render(template, {
      projectName,
      wsProviderUrl,
      dbName,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      appPort,
    });
  }
}
