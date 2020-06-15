import { Config } from 'warthog';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getTemplatePath, createFile, createDir } from '../utils/utils';
import * as prettier from 'prettier';

import Debug from "debug";
import { WarthogModel } from '../model';
import { FTSQueryRenderer } from './FTSQueryRenderer';
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
      const destFolder = this.getDestFolder(objType.name);
      const generatedFolderRelPath = path.relative(destFolder, this.config.get('GENERATED_FOLDER'));

      const modelRenderer = new ModelRenderer({ "generatedFolderRelPath": generatedFolderRelPath });
      const render = (template:string) => modelRenderer.generate(template, objType);
      
      createDir(path.resolve(process.cwd(), destFolder), false, true);
      
      ['model', 'resolver', 'service'].map((template) => {
        this.renderAndWrite(`entities/${template}.ts.mst`, 
          path.join(destFolder, `${kebabCase(objType.name)}.${template}.ts`),
          render);
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

    const queryRenderer = new FTSQueryRenderer();
    
    this.model.ftsQueries.map((query) => {
      const render = (template:string) => queryRenderer.generate(template, query);
      const filePrefix = kebabCase(query.name);

       // migration
      this.renderAndWrite('textsearch/migration.ts.mst', 
          path.join(migrationsDir, `${filePrefix}.migration.ts`), render);
        
       // resolver   
      this.renderAndWrite('textsearch/resolver.ts.mst', 
          path.join(ftsDir, `${filePrefix}.resolver.ts`), render);   

       // service
      this.renderAndWrite('textsearch/service.ts.mst', 
          path.join(ftsDir, `${filePrefix}.service.ts`), render);   
    })
    
  }


  /**
   * 
   * @param template relative path to a template from the templates folder, e.g. 'db-helper.mst'
   * @param destPath relative path to the `generated/graphql-server' folder, e.g. 'src/index.ts'
   * @param render function which transforms the template contents
   */
  private renderAndWrite(template: string, destPath: string, render: (data: string) => string) {
    const templateData: string = fs.readFileSync(getTemplatePath(template), 'utf-8');
    debug(`Source: ${getTemplatePath(template)}`);
    let rendered: string = render(templateData);
    
    rendered = prettier.format(rendered, {
      parser: 'typescript'
    });

    debug(`Transformed: ${rendered}`);
    const destFullPath = path.resolve(process.cwd(), destPath);
    
    debug(`Writing to: ${destFullPath}`);
    createFile(destFullPath, rendered, true);
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
  
}