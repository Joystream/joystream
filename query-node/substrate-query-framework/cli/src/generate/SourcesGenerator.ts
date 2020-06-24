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
import { InterfacesRenderer } from './InterfacesRenderer';

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

      const render = (template: string) => modelRenderer.render(template);

      const destFolder = this.config.getDestFolder(objType.name);
      createDir(path.resolve(process.cwd(), destFolder), false, true);

      const toGenerate = objType.isInterface ? ['model'] : ['model', 'resolver', 'service'];

      toGenerate.map(template => {
        this.renderAndWrite(
          `entities/${template}.ts.mst`,
          path.join(destFolder, `${kebabCase(objType.name)}.${template}.ts`),
          render
        );
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
      const render = (template: string) => queryRenderer.generate(template, query);
      const filePrefix = kebabCase(query.name);

      // migration
      this.renderAndWrite(
        'textsearch/migration.ts.mst',
        path.join(migrationsDir, `${filePrefix}.migration.ts`),
        render
      );

      // resolver
      this.renderAndWrite('textsearch/resolver.ts.mst', path.join(ftsDir, `${filePrefix}.resolver.ts`), render);

      // service
      this.renderAndWrite('textsearch/service.ts.mst', path.join(ftsDir, `${filePrefix}.service.ts`), render);
    });
  }

  genearateInterfaces(): void {
    const interfacesDir = this.config.getDestFolder(ENUMS_FOLDER);
    createDir(path.resolve(process.cwd(), interfacesDir), false, true);

    const interfacesRenderer = new InterfacesRenderer(this.model);
    const render = (template: string) => interfacesRenderer.render(template);
    this.renderAndWrite('entities/interfaces.ts.mst', path.join(interfacesDir, `interfaces.ts`), render);
  }

  generateEnums(): void {
    const enumsDir = this.config.getDestFolder(ENUMS_FOLDER);
    createDir(path.resolve(process.cwd(), enumsDir), false, true);

    const enumRenderer = new EnumRenderer(this.model);
    const render = (template: string) => enumRenderer.render(template);
    this.renderAndWrite('entities/enums.ts.mst', path.join(enumsDir, `enums.ts`), render);
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
}
