import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';

import Command from '@oclif/command';
import { copyFileSync } from 'fs-extra';
import { cli as warthogCli } from '../index';

import { WarthogModelBuilder } from './../parse/WarthogModelBuilder';
import { getTemplatePath } from '../utils/utils';
import Debug from 'debug';
import { SourcesGenerator } from '../generate/SourcesGenerator';

const debug = Debug('qnode-cli:warthog-wrapper');

export default class WarthogWrapper {
  private readonly command: Command;
  private readonly schemaPath: string;

  constructor(command: Command, schemaPath: string) {
    this.command = command;
    this.schemaPath = schemaPath;
  }

  async run(): Promise<void> {
    // Order of calling functions is important!!!
    await this.newProject();

    this.installDependencies();

    await this.createDB();

    this.generateWarthogSources();

    this.codegen();

    this.createMigrations();

    this.runMigrations();
  }

  async generateAPIPreview(): Promise<void> {
    // Order of calling functions is important!!!
    await this.newProject();
    this.installDependencies();
    this.generateWarthogSources();
    this.codegen();
  }

  async newProject(projectName = 'query_node'): Promise<void> {
    await warthogCli.run(`new ${projectName}`);

    // Override warthog's index.ts file for custom naming strategy
    fs.copyFileSync(getTemplatePath('graphql-server.index.mst'), path.resolve(process.cwd(), 'src/index.ts'));

    this.updateDotenv();
  }

  installDependencies(): void {
    if (!fs.existsSync('package.json')) {
      this.command.error('Could not found package.json file in the current working directory');
    }

    // Temporary tslib fix
    const pkgFile = JSON.parse(fs.readFileSync('package.json', 'utf8')) as Record<string, Record<string, unknown>>;
    pkgFile.resolutions['tslib'] = '1.11.2';
    pkgFile.scripts['sync'] = 'SYNC=true WARTHOG_DB_SYNCHRONIZE=true ts-node-dev --type-check src/index.ts';
    fs.writeFileSync('package.json', JSON.stringify(pkgFile, null, 2));

    this.command.log('Installing graphql-server dependencies...');
    execSync('yarn add lodash'); // add lodash dep
    execSync('yarn install');

    this.command.log('done...');
  }

  async createDB(): Promise<void> {
    await warthogCli.run('db:create');
  }

  /**
   * Generate the warthog source files:
   *   - model/resolver/service for entities
   *   - Fulltext search queries (migration/resolver/service)
   */
  generateWarthogSources(): void {
    const schemaPath = path.resolve(process.cwd(), this.schemaPath);

    const modelBuilder = new WarthogModelBuilder(schemaPath);
    const model = modelBuilder.buildWarthogModel();

    const sourcesGenerator = new SourcesGenerator(model);
    sourcesGenerator.generate();
  }

  codegen(): void {
    execSync('yarn warthog codegen && yarn dotenv:generate');
  }

  createMigrations(): void {
    execSync('yarn sync');
  }

  runMigrations(): void {
    debug('performing migrations');
    execSync('yarn db:migrate');
  }

  updateDotenv(): void {
    // copy dotnenvi env.yml file
    debug('Creating graphql-server/env.yml');
    copyFileSync(getTemplatePath('warthog.env.yml'), path.resolve(process.cwd(), 'env.yml'));
    const envConfig = dotenv.parse(fs.readFileSync('.env'));

    // Override DB_NAME, PORT, ...
    envConfig['WARTHOG_DB_DATABASE'] = process.env.DB_NAME || envConfig['WARTHOG_DB_DATABASE'];
    envConfig['WARTHOG_DB_USERNAME'] = process.env.DB_USER || envConfig['WARTHOG_DB_USERNAME'];
    envConfig['WARTHOG_DB_PASSWORD'] = process.env.DB_PASS || envConfig['WARTHOG_DB_PASSWORD'];
    envConfig['WARTHOG_DB_HOST'] = process.env.DB_HOST || envConfig['WARTHOG_DB_HOST'];
    envConfig['WARTHOG_DB_PORT'] = process.env.DB_PORT || envConfig['WARTHOG_DB_PORT'];
    envConfig['WARTHOG_APP_PORT'] = process.env.GRAPHQL_SERVER_PORT || envConfig['WARTHOG_APP_PORT'];

    const newEnvConfig = Object.keys(envConfig)
      .map(key => `${key}=${envConfig[key]}`)
      .join('\n');
    fs.writeFileSync('.env', newEnvConfig);
  }
}
