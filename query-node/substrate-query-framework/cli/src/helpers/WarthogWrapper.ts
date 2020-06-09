import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Command from '@oclif/command';
import { copyFileSync } from 'fs-extra';
const warthogCli = require('warthog/dist/cli/cli');

import { DatabaseModelCodeGenerator } from './ModelCodeGenerator';
import { getTemplatePath, createFile, createDir } from '../utils/utils';
import { WarthogModel } from '../model/WarthogModel';
import { FTSQueryGenerator } from './FTSQueryGenerator';
import Debug from "debug";

const debug = Debug('qnode-cli:warthog-wrapper');

export default class WarthogWrapper {
  private readonly command: Command;
  private readonly schemaPath: string;
  private model?: WarthogModel;

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

    this.generateQueries();

    await this.runMigrations();
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
    this.model = modelGenerator.generateWarthogModel();

    debug(`Genetated Warthog Model: ${JSON.stringify(this.model, null, 2)}`);

    const commands = this.model.toWarthogStringDefinitions()
      .map(modelString => ['yarn warthog generate', modelString].join(' '));

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

  async codegen() {
    execSync('yarn warthog codegen && yarn dotenv:generate');
  }

  async createMigrations() {
    execSync('yarn sync');
  }

  async runMigrations() {
      debug('performing migrations');
      execSync('yarn db:migrate');
  }

  generateQueries() {
      if (!this.model) {
          throw new Error("Warthog model is undefined");
      }
      // create migrations dir if not exists
      createDir(path.resolve(process.cwd(), 'db/migrations'), false, true);
      
      // create dir if the textsearch module
      createDir(path.resolve(process.cwd(), 'src/modules/textsearch'), false, true);

      const queryGenerator = new FTSQueryGenerator();
      
      this.model.ftsQueries.map((query) => {
         const transform = (template:string) => queryGenerator.generate(template, query);
         
         // migration
         this.transformAndWrite('textsearch/migration.ts.mst', 
            `db/migrations/${query.name}.migration.ts`,
            transform);
          
         // resolver   
         this.transformAndWrite('textsearch/resolver.ts.mst', 
            `src/modules/textsearch/${query.name}.resolver.ts`, transform);   

         // service
         this.transformAndWrite('textsearch/service.ts.mst', 
            `src/modules/textsearch/${query.name}.service.ts`, transform);   
      })
      
  }

  /**
   * 
   * @param template relative path to a template from the templates folder, e.g. 'db-helper.mst'
   * @param destPath relative path to the `generated/graphql-server' folder, e.g. 'src/index.ts'
   * @param transformer function which transforms the template contents
   */
  private transformAndWrite(template: string, destPath: string, transform: (data: string) => string) {
    const templateData: string = fs.readFileSync(getTemplatePath(template), 'utf-8');
    debug(`Source: ${getTemplatePath(template)}`);
    const transformed: string = transform(templateData);
    
    debug(`Transformed: ${transformed}`);
    const destFullPath = path.resolve(process.cwd(), destPath);
    
    debug(`Writing to: ${destFullPath}`);
    createFile(destFullPath, transformed, true);
  }

  updateDotenv() {
    // copy dotnenvi env.yml file 
    debug("Creating graphql-server/env.yml")
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
