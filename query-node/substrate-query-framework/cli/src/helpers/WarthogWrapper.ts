import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import execa = require('execa');

import Command from '@oclif/command';
import { cli as warthogCli } from '../index';

import { WarthogModelBuilder } from './../parse/WarthogModelBuilder';
import { getTemplatePath } from '../utils/utils';
import Debug from 'debug';
import { SourcesGenerator } from '../generate/SourcesGenerator';
import Listr = require('listr');

const debug = Debug('qnode-cli:warthog-wrapper');

export default class WarthogWrapper {
  private readonly command: Command;
  private readonly schemaPath: string;
  private readonly schemaResolvedPath: string;

  constructor(command: Command, schemaPath: string) {
    this.command = command;
    this.schemaPath = schemaPath;
    this.schemaResolvedPath = path.resolve(process.cwd(), this.schemaPath);
    if (!fs.existsSync(this.schemaResolvedPath)) {
      throw new Error(`Cannot open the schema file ${this.schemaResolvedPath}. Check if it exists.`);
    }
  }

  async run(): Promise<void> {
    // Order of calling functions is important!!!
    const tasks = new Listr([
      {
        title: 'Set up a new Warthog project',
        task: async () => {
          await this.newProject();
        },
      },
      {
        title: 'Install GraphQL server dependencies',
        task: async () => {
          await this.installDependencies();
        },
      },
      {
        title: 'Generate server sources',
        task: () => {
          this.generateWarthogSources();
        },
      },
      {
        title: 'Warthog codegen',
        task: async () => {
          await this.codegen();
        },
      },
    ]);

    await tasks.run();
  }

  async generateDB(): Promise<void> {
    const tasks = new Listr([
      {
        title: 'Create database',
        task: async () => {
          if (!process.env.DB_NAME) {
            throw new Error('DB_NAME env variable is not set, check that .env file exists');
          }
          await this.createDB();
        },
      },
      {
        title: 'Generate migrations',
        task: async () => {
          await this.createMigrations();
        },
      },
      {
        title: 'Run migrations',
        task: async () => {
          await this.runMigrations();
        },
      },
    ]);
    await tasks.run();
  }

  async generateAPIPreview(): Promise<void> {
    // Order of calling functions is important!!!
    await this.newProject();
    await this.installDependencies();
    this.generateWarthogSources();
    await this.codegen();
  }

  async newProject(projectName = 'query_node'): Promise<void> {
    const consoleFn = console.log;
    console.log = () => {
      return;
    };
    await warthogCli.run(`new ${projectName}`);
    console.log = consoleFn;

    // Override warthog's index.ts file for custom naming strategy
    fs.copyFileSync(getTemplatePath('graphql-server.index.mst'), path.resolve(process.cwd(), 'src/index.ts'));

    await this.updateDotenv();
  }

  async installDependencies(): Promise<void> {
    if (!fs.existsSync('package.json')) {
      this.command.error('Could not found package.json file in the current working directory');
    }

    // Temporary tslib fix
    const pkgFile = JSON.parse(fs.readFileSync('package.json', 'utf8')) as Record<string, Record<string, unknown>>;
    pkgFile.resolutions['tslib'] = '1.11.2';
    pkgFile.scripts['db:sync'] = 'SYNC=true WARTHOG_DB_SYNCHRONIZE=true ts-node --type-check src/index.ts';
    fs.writeFileSync('package.json', JSON.stringify(pkgFile, null, 2));

    //this.command.log('Installing graphql-server dependencies...');
    await execa('yarn', ['add', 'lodash']); // add lodash dep
    await execa('yarn', ['install']);

    //this.command.log('done...');
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
    const modelBuilder = new WarthogModelBuilder(this.schemaResolvedPath);
    const model = modelBuilder.buildWarthogModel();

    const sourcesGenerator = new SourcesGenerator(model);
    sourcesGenerator.generate();
  }

  async codegen(): Promise<void> {
    await execa('yarn', ['warthog', 'codegen']);
    await execa('yarn', ['dotenv:generate']);
  }

  async createMigrations(): Promise<void> {
    await execa('yarn', ['db:sync']);
  }

  async runMigrations(): Promise<void> {
    debug('performing migrations');
    await execa('yarn', ['db:migrate']);
  }

  async updateDotenv(): Promise<void> {
    // copy dotnenvi env.yml file
    debug('Creating graphql-server/env.yml');
    await fs.copyFile(getTemplatePath('warthog.env.yml'), path.resolve(process.cwd(), 'env.yml'));
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
    await fs.writeFile('.env', newEnvConfig);
  }
}
