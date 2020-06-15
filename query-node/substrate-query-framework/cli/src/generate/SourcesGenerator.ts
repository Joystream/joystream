import { Config } from 'warthog';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getTemplatePath, createFile, createDir } from '../utils/utils';
import * as prettier from 'prettier';

import Debug from "debug";
import { WarthogModel } from '../model';
import { FTSQueryGenerator } from './FTSQueryRenderer';
import { ModelRenderer } from './ModelRenderer';
import { kebabCase, camelCase } from 'lodash';
import { supplant, pascalCase, camelPlural } from './utils';

const debug = Debug('qnode-cli:sources-generator');

const FULL_TEXT_QUERIES_FOLDER = 'fulltextqueries';
/**
 * additional context to be passed to the generator, 
 * e.g. to have predictable timestamps
 */
export interface GeneratorContext {
  [key:string]: unknown
}

export class SourcesGenerator {
  readonly config: Config;
  readonly cliGeneratePath: string;
  readonly model: WarthogModel;

  constructor(model: WarthogModel) {
    this.config = new Config();
    this.config.loadSync();
    this.model = model;

    this.cliGeneratePath =
      path.join(this.config.get('ROOT_FOLDER'), '/', this.config.get('CLI_GENERATE_PATH'), '/');
    
  }

  generate(): void {
    this.generateModels();
    this.generateQueries();
  }

  generateModels():void {
    
    //TODO: Refactor this and read all the paths from Warthog's config
    createDir(path.resolve(process.cwd(), 'src/modules'), false, true);

    this.model.types.map((objType) => {
      const modelRenderer = new ModelRenderer({ "generatedFolderRelPath": this.getGeneratedFolderRelativePath(objType.name) });
      const transform = (template:string) => modelRenderer.generate(template, objType);
      
      createDir(path.resolve(process.cwd(), this.getDestFolder(objType.name)), false, true);
      
      const destFiles = this.getDestFiles(objType.name);
      ['model', 'resolver', 'service'].map((s) => {
        this.transformAndWrite(`entities/${s}.ts.mst`, 
          destFiles[s],
          transform);
      })
    });
  } 

  generateQueries():void {
    if (!this.model) {
        throw new Error("Warthog model is undefined");
    }

    // create migrations dir if not exists
    const migrationsDir = this.config.get('DB_MIGRATIONS_DIR') as string;
    createDir(path.resolve(process.cwd(), migrationsDir), false, true);
    
    // create dir if the textsearch module
    const ftsDir = this.getDestFolder(FULL_TEXT_QUERIES_FOLDER);
    createDir(path.resolve(process.cwd(), ftsDir), false, true);

    const queryGenerator = new FTSQueryGenerator();
    
    this.model.ftsQueries.map((query) => {
      const transform = (template:string) => queryGenerator.generate(template, query);
      const filePrefix = kebabCase(query.name);

       // migration
      this.transformAndWrite('textsearch/migration.ts.mst', 
          path.join(migrationsDir, `${filePrefix}.migration.ts`), transform);
        
       // resolver   
      this.transformAndWrite('textsearch/resolver.ts.mst', 
          path.join(ftsDir, `${filePrefix}.resolver.ts`), transform);   

       // service
      this.transformAndWrite('textsearch/service.ts.mst', 
          path.join(ftsDir, `${filePrefix}.service.ts`), transform);   
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
    let transformed: string = transform(templateData);
    
    transformed = prettier.format(transformed, {
      parser: 'typescript'
    });

    debug(`Transformed: ${transformed}`);
    const destFullPath = path.resolve(process.cwd(), destPath);
    
    debug(`Writing to: ${destFullPath}`);
    createFile(destFullPath, transformed, true);
  }

  getDestFolder(name: string): string {
    const names = {
        className: pascalCase(name),
        camelName: camelCase(name),
        kebabName: kebabCase(name),
        camelNamePlural: camelPlural(name)
    }
    return supplant(this.cliGeneratePath, names);
  }
  
  getGeneratedFolderRelativePath(name: string): string {
    return path.relative(this.getDestFolder(name), this.config.get('GENERATED_FOLDER')); 
  }

  getDestFiles(name: string): { [key: string]: string }{
    return {
      model: path.join(this.getDestFolder(name), `${kebabCase(name)}.model.ts`),
      resolver: path.join(this.getDestFolder(name), `${kebabCase(name)}.resolver.ts`),
      service: path.join(this.getDestFolder(name), `${kebabCase(name)}.service.ts`)
    }
  }
}