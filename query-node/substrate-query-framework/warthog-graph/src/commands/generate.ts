import { cosmiconfig } from 'cosmiconfig';
import * as path from 'path';
import * as prettier from 'prettier';

import { GluegunToolbox } from 'gluegun';
import { Toolbox } from 'gluegun/build/types/domain/toolbox';
import Debug from "debug";

const debug = Debug('warthog-graph:generate');


export default {
  name: 'graph-generate',
  alias: ['gr-g'],
  run: async (toolbox: GluegunToolbox) => {
    const {
      config: { load },
      parameters: { options, first, array },
      print: { info, error },
      string: { supplant }
    } = toolbox;

    const config: any = load();

    debug(`Config: ${JSON.stringify(config, null, 2)}`);

    const name = first;
    if (!name) {
      return error('name is required');
    }

    const names = {
      className: toolbox.strings.pascalCase(name),
      camelName: toolbox.strings.camelCase(name),
      kebabName: toolbox.strings.kebabCase(name),
      // Not proper pluralization, but good enough and easy to fix in generated code
      camelNamePlural: toolbox.strings.camelCase(name) + 's'
    };

    // Allow folder to be passed in or pulled from config files
    const cliGeneratePath =
      options.folder ||
      path.join(config.get('ROOT_FOLDER'), '/', config.get('CLI_GENERATE_PATH'), '/');

    // TODO:DOCS
    // Allow interpolation of the above names into the generate path like './src/${kebabName}'
    const destFolder = supplant(cliGeneratePath, names);

    const warthogPathInGeneratedFolder = config.get('MODULE_IMPORT_PATH');
    const generatedPath = config.get('GENERATED_FOLDER');
    const generatedFolderRelativePath = path.relative(destFolder, generatedPath);

    let warthogPathInSourceFiles;
    // If we're generating inside of an external project, we'll just import from 'warthog'
    if (warthogPathInGeneratedFolder === 'warthog') {
      warthogPathInSourceFiles = 'warthog';
    } else {
      // This ensures we use a relative path in the `examples` folders within the warthog repo
      const warthogAbsolutePath = path.join(generatedPath, warthogPathInGeneratedFolder);
      warthogPathInSourceFiles = path.relative(destFolder, warthogAbsolutePath);
    }

    const getRelativePathForModel = (name: string): string => {
      // relative import path
      return path.join(
        '..',
        toolbox.strings.kebabCase(name),
        `${toolbox.strings.camelCase(name)}.model`
      );
    };

    // derive props directly from the WarthhogModel
    const props = {
      ...names,
      pascalCase: toolbox.strings.pascalCase,
      camelCase: toolbox.strings.camelCase,
      fields: array ? processFields(array.slice(1)) : [],
      generatedFolderRelativePath,
      warthogPathInSourceFiles,
      getRelativePathForModel
    };

    await generateFile(
      toolbox,
      props,
      'generate/model.ts.ejs',
      destFolder,
      `${names.kebabName}.model.ts`
    );

    await generateFile(
      toolbox,
      props,
      'generate/service.ts.ejs',
      destFolder,
      `${names.kebabName}.service.ts`
    );

    await generateFile(
      toolbox,
      props,
      'generate/resolver.ts.ejs',
      destFolder,
      `${names.kebabName}.resolver.ts`
    );

    return;
  }
};

async function generateFile(
  toolbox: Toolbox,
  props: any,
  template: string,
  destFolder: string,
  filename: string
) {
  const target = path.join(destFolder, '/', filename);
  const explorer = cosmiconfig('prettier');
  const config = await explorer.search();

  let generated = await toolbox.template.generate({
    template,
    target,
    props
  });

  generated = prettier.format(generated, {
    ...(config ? config.config : {}),
    parser: 'typescript'
  });

  toolbox.filesystem.write(target, generated);

  toolbox.print.info(`Generated file at ${target}`);
}

function processFields(fields: string[]) {
  // If user doesn't pass fields, generate a single placeholder
  if (!fields.length) {
    fields = ['fieldName'];
  }

  return fields.map((raw: string) => {
    let field: any = {};
    if (raw.endsWith('!')) {
      field.required = true;
      raw = raw.substring(0, raw.length - 1);
    }
    const parts = raw.split(':');
    if (!parts.length) {
      throw new Error('found an empty field');
    }

    // Make sure this is camel case
    field.name = parts[0];

    if (parts.length > 1) {
      // validate this is a valid type
      field.type = parts[1];
    } else {
      field.type = 'string';
    }

    const typeFields: { [key: string]: { [key: string]: string } } = {
      bool: {
        decorator: 'BooleanField',
        tsType: 'boolean'
      },
      date: {
        decorator: 'DateField',
        tsType: 'Date'
      },
      int: {
        decorator: 'IntField',
        tsType: 'number'
      },
      float: {
        decorator: 'FloatField',
        tsType: 'number'
      },
      json: {
        decorator: 'JSONField',
        tsType: 'JsonObject'
      },
      otm: {
        decorator: 'OneToMany',
        tsType: '---'
      },
      string: {
        decorator: 'StringField',
        tsType: 'string'
      }
    };

    // TODO: validate otm fields are plural?

    field = {
      ...field,
      ...typeFields[field.type]
    };

    return field;
  });
}