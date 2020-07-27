import { Command, flags } from '@oclif/command';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as utils from './../utils/utils';
import cli from 'cli-ux';
import { getTemplatePath } from '../utils/utils';
import Mustache = require('mustache');
import dotenv = require('dotenv');
import execa = require('execa');

const DEFAULT_WS_API_ENDPOINT = 'wss://kusama-rpc.polkadot.io/';

export default class Scaffold extends Command {
  static description = `Starter kit: generates a directory layout and a sample schema file`;

  static flags = {
    projectName: flags.string({ char: 'n', description: 'Project name' }),
    wsProviderUrl: flags.string({
      char: 'n',
      description: 'Substrate WS provider endpoint',
      default: DEFAULT_WS_API_ENDPOINT,
    }),
    blockHeight: flags.string({ char: 'b', description: 'Start block height', default: '0' }),
    dbHost: flags.string({ char: 'h', description: 'Database host', default: 'localhost' }),
    dbPort: flags.string({ char: 'p', description: 'Database port', default: '5432' }),
    dbUser: flags.string({ char: 'u', description: 'Database user', default: 'postgres' }),
    dbPassword: flags.string({ char: 'x', description: 'Database user password', default: 'postgres' }),
    appPort: flags.string({ char: 'a', description: 'GraphQL server port', default: '4000' }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Scaffold);

    await fs.writeFile(
      path.join(process.cwd(), '.env'),
      flags.projectName ? await this.dotenvFromFlags(flags) : await this.promptDotEnv()
    );

    dotenv.config();

    this.log('Your settings have been saved to .env, feel free to edit');

    cli.action.start('Scaffolding');

    // TODO: we don't do bootstrapping for now
    //await fs.ensureDir('bootstrap');
    // copy sample graphql schema
    await utils.copyTemplateToCWD('scaffold/schema.graphql', 'schema.graphql');

    await this.setupMappings();
    await this.setupNodeProject();
    await this.setupDocker();

    cli.action.stop();
  }

  async dotenvFromFlags(flags_: { [key: string]: string | undefined }): Promise<string> {
    const template = await fs.readFile(getTemplatePath('scaffold/.env'), 'utf-8');
    return Mustache.render(template, { ...flags_, dbName: flags_.projectName });
  }

  async promptDotEnv(): Promise<string> {
    const projectName = (await cli.prompt('Enter your project name', { required: true })) as string;
    const wsProviderUrl = (await cli.prompt('Substrate WS provider endpoint', {
      default: DEFAULT_WS_API_ENDPOINT,
    })) as string;

    const blockHeight = (await cli.prompt('Start block height', { default: '0' })) as string;

    if (isNaN(parseInt(blockHeight))) {
      throw new Error('Starting block height must be an integer');
    }

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
      blockHeight,
      dbName,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      appPort,
    });
  }

  // For now, we simply copy the hardcoded templates
  async setupMappings(): Promise<void> {
    await fs.ensureDir('mappings');
    await utils.copyTemplateToCWD('scaffold/mappings/index.ts', path.join('mappings', 'index.ts'));
    await utils.copyTemplateToCWD('scaffold/mappings/treasury.ts', path.join('mappings', 'treasury.ts'));
  }

  async setupDocker(): Promise<void> {
    await fs.ensureDir('docker');
    await utils.copyTemplateToCWD('scaffold/docker-compose.yml', 'docker-compose.yml');

    await utils.copyTemplateToCWD('scaffold/docker/Dockerfile.indexer', path.join('docker', 'Dockerfile.indexer'));
    await utils.copyTemplateToCWD('scaffold/docker/Dockerfile.server', path.join('docker', 'Dockerfile.server'));

    await utils.copyTemplateToCWD('scaffold/.dockerignore', '.dockerignore');
  }

  async setupNodeProject(): Promise<void> {
    const template = await fs.readFile(getTemplatePath('scaffold/package.json'), 'utf-8');

    await fs.writeFile(
      path.join(process.cwd(), 'package.json'),
      Mustache.render(template, {
        projectName: process.env.PROJECT_NAME,
      })
    );

    await execa('yarn', ['install']);
  }
}
