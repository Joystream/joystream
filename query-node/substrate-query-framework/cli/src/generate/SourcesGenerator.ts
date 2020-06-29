import * as fs from 'fs-extra';
import * as path from 'path';
import { getTemplatePath, createFile, createDir } from '../utils/utils';

import Debug from 'debug';
import { WarthogModel, ObjectType } from '../model';
import { FTSQueryRenderer } from './FTSQueryRenderer';
import { ModelRenderer } from './ModelRenderer';
import { EnumRenderer } from './EnumRenderer';
import { kebabCase } from './utils';
import { ConfigProvider } from './ConfigProvider';
import { EnumContextProvider } from './EnumContextProvider';

const debug = Debug('qnode-cli:sources-generator');

export const QUERIES_FOLDER = 'queries';
export const ENUMS_FOLDER = 'enums';
export const INTERFACES_FOLDER = 'interfaces';

/**
 * additional context to be passed to the generator,
 * e.g. to have predictable timestamps
 */
export interface GeneratorContext {
  [key: string]: unknown;
}

export class SourcesGenerator {
  readonly config: ConfigProvider;
  readonly model: WarthogModel;

  constructor(model: WarthogModel) {
    this.config = new ConfigProvider();
    this.model = model;
  }

  generate(): void {
    this.generateEnums();
    //this.genearateInterfaces();
    this.generateModels();
    this.generateQueries();
  }

  generateModels(): void {
    createDir(path.resolve(process.cwd(), 'src/modules'), false, true);

    const enumContextProvider = new EnumContextProvider();

    const typesAndInterfaces: ObjectType[] = [...this.model.interfaces, ...this.model.types];

    typesAndInterfaces.map(objType => {
      const context = this.config.withGeneratedFolderRelPath(objType.name);
      const modelRenderer = new ModelRenderer(this.model, objType, enumContextProvider, context);
      const destFolder = this.config.getDestFolder(objType.name);
      createDir(path.resolve(process.cwd(), destFolder), false, true);

      const tempateFile: { [key: string]: string } = {
        model: 'entities/model.ts.mst',
        resolver: objType.isInterface ? 'interfaces/resolver.ts.mst' : 'entities/resolver.ts.mst',
        service: objType.isInterface ? 'interfaces/service.ts.mst' : 'entities/service.ts.mst',
      };

      ['model', 'resolver', 'service'].map(template => {
        const rendered = modelRenderer.render(this.readTemplate(tempateFile[template]));
        const destPath = path.join(destFolder, `${kebabCase(objType.name)}.${template}.ts`);
        this.writeFile(destPath, rendered);
      });
    });
  }

  generateQueries(): void {
    if (!this.model) {
      throw new Error('Warthog model is undefined');
    }

    // create migrations dir if not exists
    const migrationsDir = this.config.getMigrationsFolder();
    createDir(path.resolve(process.cwd(), migrationsDir), false, true);

    // create dir if the textsearch module
    const ftsDir = this.config.getDestFolder(QUERIES_FOLDER);
    createDir(path.resolve(process.cwd(), ftsDir), false, true);

    const queryRenderer = new FTSQueryRenderer();

    this.model.ftsQueries.map(query => {
      //const render = (template: string) => queryRenderer.generate(template, query);
      //const filePrefix = kebabCase(query.name);

      const tempateFile = (name: string) => this.readTemplate(`textsearch/${name}.ts.mst`);
      const destPath = (name: string) => path.join(ftsDir, `${kebabCase(query.name)}.${name}.ts`);

      ['migration', 'resolver', 'service'].map(name => {
        const rendered = queryRenderer.generate(tempateFile(name), query);
        this.writeFile(destPath(name), rendered);
      });
    });
  }

  generateEnums(): void {
    const enumsDir = this.config.getDestFolder(ENUMS_FOLDER);
    createDir(path.resolve(process.cwd(), enumsDir), false, true);

    const enumRenderer = new EnumRenderer(this.model);
    const rendered = enumRenderer.render(this.readTemplate('entities/enums.ts.mst'));
    this.writeFile(path.join(enumsDir, `enums.ts`), rendered);
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
    const rendered: string = render(templateData);

    debug(`Transformed: ${rendered}`);
    const destFullPath = path.resolve(process.cwd(), destPath);

    debug(`Writing to: ${destFullPath}`);
    createFile(destFullPath, rendered, true);
  }

  private readTemplate(relPath: string) {
    debug(`Reading template: ${relPath}`);
    return fs.readFileSync(getTemplatePath(relPath), 'utf-8');
  }

  private writeFile(destPath: string, data: string) {
    const destFullPath = path.resolve(process.cwd(), destPath);

    debug(`Writing to: ${destFullPath}`);
    createFile(destFullPath, data, true);
  }
}
