import 'reflect-metadata';
import * as fs from 'fs';
import { extname } from 'path';
import { deserializeArray, Type } from 'class-transformer';
const cli = require('warthog/dist/cli/cli');

const defaultSchemaPath = './schema.json';

class Input {
	name!: string;

	@Type(() => Field)
	fields!: [Field];

	getFormattedFields() {
		return this.fields.map(f => `${f.name}:${f.type}`).join(' ');
	}
}

class Field {
	name!: string;
	type!: string;
	description?: string;
}

/**
 * Create a new warthog project
 */
function init() {
	cli.run('new');
}

/**
 * Generate model/resolver/service for input types in schema.json
 */
function generate(inputs: Input[]) {
	// Make arguments ready for "generate" command
	const commands = inputs.map(input => {
		if (!input.name) logErrorAndExit('A type must have "name" property');
		if (!input.fields)
			logErrorAndExit(`A defined type must have at least one field. Got "${input.fields}"`);

		// e.g generate user name:string! age:int!
		return ['generate', input.name, input.getFormattedFields()].join(' ');
	});

	// Execute commands
	commands.forEach(command => (command ? cli.run(command) : ''));
}

function prepareInputData(schemaPath: string): Input[] {
	if (!fs.existsSync(schemaPath)) {
		logErrorAndExit(`File does not exists! ${schemaPath}`);
	}
	if (!extname(schemaPath)) {
		logErrorAndExit('Schema file must be a JSON file!');
	}
	const data = fs.readFileSync(schemaPath, 'utf8');
	return deserializeArray(Input, data);
}

function logErrorAndExit(message: string) {
	console.error(message);
	process.exit(1);
}

function main() {
	if (process.argv.length === 2) {
		logErrorAndExit('Expected at least one argument!');
	}

	const commandIndex = 2;
	const command = process.argv[commandIndex];

	switch (command) {
		case 'new':
			init();
			break;
		case 'generate':
			let schemaPath = process.argv[commandIndex + 1];
			schemaPath = schemaPath ? schemaPath : defaultSchemaPath;
			generate(prepareInputData(schemaPath));
			break;
		default:
			logErrorAndExit('Expected at least one argument!');
	}
}

main();
