import * as fs from 'fs';
import * as path from 'path';
import * as Prettier from 'prettier';
import { render } from 'mustache';
import { extname } from 'path';
import { Command, flags } from '@oclif/command';
import { deserializeArray } from 'class-transformer';

import { Input } from '../helpers/schema';
import { createDir, createFile } from '../utils/utils';

const prettierOptions: Prettier.Options = {
  parser: 'typescript',
  endOfLine: 'auto',
};

export default class Event extends Command {
  static description = 'Generate events from schema';

  static args = [{ name: 'generate' }];
  static flags = {
    schema: flags.string({ char: 's', description: 'Schema path', default: './schema.json' }),
  };

  async run() {
    const { flags } = this.parse(Event);
    const inputs = this.prepareInputData(flags.schema);
    this.generateEvents(inputs);
  }

  prepareInputData(schemaPath: string): Input[] {
    if (!fs.existsSync(schemaPath)) {
      this.error(`File does not exists! ${schemaPath}`);
    }
    if (!extname(schemaPath)) {
      this.error('Schema file must be a JSON file!');
    }
    const data = fs.readFileSync(schemaPath, 'utf8');
    return deserializeArray(Input, data);
  }

  generateEvents(inputs: Input[]) {
    const templatePath = path.resolve(path.resolve(__dirname, '..'), 'helpers', 'template.mst');
    const template = fs.readFileSync(templatePath, 'utf8');

    const generatedFolder = path.resolve(process.cwd(), 'generated');
    createDir(generatedFolder, true);

    let eventFileName;
    let eventFileContent;
    let newInput;

    inputs.forEach((input) => {
      newInput = {
        name: input.name,
        fields: input.fields.map((f) => {
          let type = f.type.endsWith('!') ? f.type.slice(0, -1) : f.type;
          return { name: f.name, type: type };
        }),
      };
      eventFileContent = render(template, { input: newInput });
      eventFileName = `${input.name}.ts`;
      createFile(`${generatedFolder}/${eventFileName}`, eventFileContent);
    });
  }
}
