import * as fs from 'fs';
import { extname } from 'path';
import { Command, flags } from '@oclif/command';
import { deserializeArray } from 'class-transformer';
const cli = require('warthog/dist/cli/cli');

import { Input } from '../helpers/schema';

export default class Generate extends Command {
  static description =
    'Use warthog cli and input type definetion to generate model/resolver/service.';

  static flags = {
    help: flags.help({ char: 'h' }),
    schema: flags.string({ char: 's', description: 'Schema path', default: './schema.json' })
  };
  async run() {
    const { flags } = this.parse(Generate);
    const inputs = this.prepareInputData(flags.schema);
    this.generate(inputs);
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

  /**
   * Generate model/resolver/service for input types in schema.json
   */
  generate(inputs: Input[]) {
    // Make arguments ready for "generate" command
    const commands = inputs.map(input => {
      if (!input.name) this.error('A type must have "name" property');
      if (!input.fields) {
        this.error(
          `A defined type must have at least one field. Got name: ${input.name} fields:"${input.fields}"`
        );
      }

      const fields = input.fields
        .map(f => {
          if (!f.name) this.error(`Empty field name. Got ${f.name}`);
          if (!f.type) this.error(`Empty field type. Got ${f.type}`);
          return `${f.name}:${f.type}`;
        })
        .join(' ');

      // e.g generate user name:string! age:int!
      return ['generate', input.name, fields].join(' ');
    });

    // Execute commands
    commands.forEach(command => (command ? cli.run(command) : ''));
  }
}
