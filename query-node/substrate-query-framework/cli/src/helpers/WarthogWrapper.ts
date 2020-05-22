import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Command from '@oclif/command';
const warthogCli = require('warthog/dist/cli/cli');

import { DatabaseModelCodeGenerator } from './ModelCodeGenerator';
import { getTemplatePath } from '../utils/utils';

export default class WarthogWrapper {
  private readonly command: Command;
  private readonly schemaPath: string;

  constructor(command: Command, schemaPath: string) {
    this.command = command;
    this.schemaPath = schemaPath;
  }

  async run() {
    // Order of calling functions is important!!!
    await this.newProject();

    this.installDependencies();

    await this.createDB();

    await this.createModels();

    this.codegen();

    await this.createMigrations();
  }

  async newProject(projectName: string = 'query_node') {
    await warthogCli.run(`new ${projectName}`);

    // Override warthog's index.ts file for custom naming strategy
    fs.copyFileSync(getTemplatePath('graphql-server.index.mst'), path.resolve(process.cwd(), 'src/index.ts'));

    this.updateDotenv();
  }

  installDependencies() {
    if (!fs.existsSync('package.json')) {
      this.command.error('Could not found package.json file in the current working directory');
    }

    // Temporary tslib fix
    let pkgFile = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkgFile.resolutions['tslib'] = '1.11.2';
    pkgFile.scripts['sync'] = 'SYNC=true WARTHOG_DB_SYNCHRONIZE=true ts-node-dev --type-check src/index.ts';
    fs.writeFileSync('package.json', JSON.stringify(pkgFile, null, 2));

    this.command.log('Installing graphql-server dependencies...');

    execSync('yarn install');

    this.command.log('done...');
  }

  async createDB() {
    await warthogCli.run('db:create');
  }

  /**
   * Generate model/resolver/service for input types in schema.json
   */
  async createModels() {
    const schemaPath = path.resolve(process.cwd(), this.schemaPath);

    const modelGenerator = new DatabaseModelCodeGenerator(schemaPath);
    const commands = modelGenerator
      .generateModelDefinationsForWarthog()
      .map(model => ['yarn warthog generate', model].join(' '));

    // Execute commands
    commands.forEach(async command => {
      if (command) {
        // Doesnt wait for the process to finish
        // await warthogCli.run(command);

        // it waits till it's done
        execSync(command);
      }
    });
  }

  async createMigrations() {
    execSync('yarn sync');
  }

  async codegen() {
    execSync('yarn warthog codegen');
  }

  updateDotenv() {
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
