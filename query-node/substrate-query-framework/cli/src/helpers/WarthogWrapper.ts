import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { deserializeArray } from 'class-transformer';
const warthogCli = require('warthog/dist/cli/cli');

import { Input } from './schema';
import Command from '@oclif/command';

export default class WarthogWrapper {
  private readonly command: Command;
  private readonly schemaPath: string;

  constructor(command: Command) {
    this.command = command;
    this.schemaPath = '../../schema.json';
  }

  async run() {
    // Order of calling functions is important!!!
    await this.newProject();

    this.installDependencies();

    await this.createDB();
    this.command.log('createDB');

    await this.createModels();

    this.codegen();

    await this.createMigrations();
  }

  async newProject(projectName: string = 'query_node') {
    await warthogCli.run(`new ${projectName}`);
    this.updateDotenv();
  }

  installDependencies() {
    if (!fs.existsSync('package.json')) {
      this.command.error('Could not found package.json file in the current working directory');
    }

    // Temporary tslib fix
    let pkgFile = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkgFile.resolutions["tslib"] = "1.11.2"
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

    if (!fs.existsSync(schemaPath)) {
      this.command.error(`File does not exists! ${schemaPath}`);
    }
    if (!path.extname(schemaPath)) {
      this.command.error('Schema file must be a JSON file!');
    }
    const data = fs.readFileSync(schemaPath, 'utf8');
    const inputs = deserializeArray(Input, data);

    // Make arguments ready for "generate" command
    const commands = inputs.map(input => {
      if (!input.name) {
        this.command.error('A type must have "name" property');
      }
      if (!input.fields) {
        this.command.error(
          `A defined type must have at least one field. Got name: ${input.name} fields:"${input.fields}"`
        );
      }

      const fields = input.fields
        .map(f => {
          if (!f.name) this.command.error(`Empty field name. Got ${f.name}`);
          if (!f.type) this.command.error(`Empty field type. Got ${f.type}`);
          return `${f.name}:${f.type}`;
        })
        .join(' ');

      // e.g generate user name:string! age:int!
      return ['yarn warthog generate', input.name, fields].join(' ');
    });

    // Execute commands
    commands.forEach(async command => {
      console.log(command);
      if (command) {
        // Doesnt wait for the process to finish
        // await warthogCli.run(command);

        // it waits till it's done
        execSync(command);
      }
    });
  }

  async createMigrations() {
    await warthogCli.run(`db:migrate:generate --name=Create-database-table`);
    await warthogCli.run('db:migrate');
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
