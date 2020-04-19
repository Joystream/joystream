const cli = require('warthog/dist/cli/cli');
const definations: Input[] = require('./schema.json');

interface Input {
	name: String;
	fields: [Field];
}

interface Field {
	name: string;
	type: string;
	description: string;
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
function generate() {
	const command = 'generate';
	// Make arguments ready for "generate" command
	const commands = definations.map(input => {
		// e.g name:string! age:int!
		const fields = input.fields.map(f => `${f.name}:${f.type}`).join(' ');

		// e.g generate user name:string! age:int!
		return [command, input.name, fields].join(' ');
	});

	// Execute commands
	commands.forEach(command => cli.run(command));
}

function main() {
	const command = process.argv[2];
	switch (command) {
		case 'new':
			init();
			break;
		case 'generate':
			generate();
			break;
		default:
			throw new Error('Missing command! Available commands [init, generate]');
	}
}

main();
