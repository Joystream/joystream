import { Command } from '@oclif/command';
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

  async run(): Promise<void> {
    await fs.writeFile(path.join(process.cwd(), '.env'), await this.promptDotEnv());

    dotenv.config();

    this.log('Your settings have been saved to .env, feel free to edit');

    cli.action.start('Scaffolding');

    await fs.ensureDir('mappings');
    await fs.ensureDir('bootstrap');

    // copy docker-compose
    await utils.copyTemplateToCWD('scaffold/docker-compose.yml', 'docker-compose.yml');

    // copy sample graphql schema
    await utils.copyTemplateToCWD('scaffold/schema.graphql', 'schema.graphql');

    await this.setupNodeProject();
    await this.setupDocker();

    cli.action.stop();
  }

  async promptDotEnv(): Promise<string> {
    const projectName = (await cli.prompt('Enter your project name', { required: true })) as string;
    const wsProviderUrl = (await cli.prompt('Substrate WS provider endpoint', {
      default: DEFAULT_WS_API_ENDPOINT,
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

  async setupDocker(): Promise<void> {
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
