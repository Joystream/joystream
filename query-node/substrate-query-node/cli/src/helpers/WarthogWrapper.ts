import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
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

  async newProject(projectName: string = 'generated') {
    await warthogCli.run(`new ${projectName}`);
  }

  installDependencies() {
    if (!existsSync('package.json')) {
      this.command.error('Could not found package.json file in the current working directory');
    }

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

    if (!existsSync(schemaPath)) {
      this.command.error(`File does not exists! ${schemaPath}`);
    }
    if (!path.extname(schemaPath)) {
      this.command.error('Schema file must be a JSON file!');
    }
    const data = readFileSync(schemaPath, 'utf8');
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
}
