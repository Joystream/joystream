const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
require("dotenv").config();
const { ApiPromise } = require('@polkadot/api');
const { HttpProvider } = require('@polkadot/rpc-provider');
const { xxhashAsHex } = require('@polkadot/util-crypto');
const execFileSync = require('child_process').execFileSync;
const execSync = require('child_process').execSync;
const binaryPath = path.join(__dirname, 'data', 'binary');
const wasmPath = path.join(__dirname, 'data', 'runtime.wasm');
const schemaPath = path.join(__dirname, 'data', 'schema.json');
const hexPath = path.join(__dirname, 'data', 'runtime.hex');
const originalSpecPath = path.join(__dirname, 'data', 'genesis.json');
const forkedSpecPath = path.join(process.env.DATA_PATH, 'fork.json');
const storagePath = path.join(process.env.DATA_PATH, 'storage.json');

const alice = process.env.ALICE || ''
const originalChain = process.env.ORIG_CHAIN || '';
const forkChain = process.env.FORK_CHAIN || '';

let chunksFetched = 0;
let separator = false;
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * All module prefixes except those mentioned in the skippedModulesPrefix will be added to this by the script.
 * If you want to add any past module or part of a skipped module, add the prefix here manually.
 *
 * Any storage value’s hex can be logged via console.log(api.query.<module>.<call>.key([...opt params])),
 * e.g. console.log(api.query.timestamp.now.key()).
 *
 * If you want a map/doublemap key prefix, you can do it via .keyPrefix(),
 * e.g. console.log(api.query.system.account.keyPrefix()).
 *
 * For module hashing, do it via xxhashAsHex,
 * e.g. console.log(xxhashAsHex('System', 128)).
 */
let prefixes = ['0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9' /* System.Account */];
const skippedModulesPrefix = ['System', 'Session', 'Babe', 'Grandpa', 'GrandpaFinality', 'FinalityTracker', 'Authorship'];

async function fixParachinStates (api, forkedSpec) {
    const skippedKeys = [
	api.query.parasScheduler.sessionStartBlock.key()
    ];
    for (const k of skippedKeys) {
	delete forkedSpec.genesis.raw.top[k];
    }
}

async function main() {
    if (!fs.existsSync(binaryPath)) {
	console.log(chalk.red('Binary missing. Please copy the binary of your substrate node to the data folder and rename the binary to "binary"'));
	process.exit(1);
    }
    execFileSync('chmod', ['+x', binaryPath]);

    if (!fs.existsSync(wasmPath)) {
	console.log(chalk.red('WASM missing. Please copy the WASM blob of your substrate node to the data folder and rename it to "runtime.wasm"'));
	process.exit(1);
    }
    execSync('cat ' + wasmPath + ' | hexdump -ve \'/1 "%02x"\' > ' + hexPath);

    let api;
    console.log(chalk.green('We are intentionally using the HTTP endpoint. If you see any warnings about that, please ignore them.'));
    if (!fs.existsSync(schemaPath)) {
	console.log(chalk.yellow('Custom Schema missing, using default schema.'));
	api = await ApiPromise.create({ provider });
    } else {
	const { types, rpc } = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
	api = await ApiPromise.create({
	    provider,
	    types,
	    rpc,
	});
    }

    if (fs.existsSync(storagePath)) {
	console.log(chalk.yellow('Reusing cached storage. Delete ./data/storage.json and rerun the script if you want to fetch latest storage'));
    } else {
	// Download state of original chain
	console.log(chalk.green('Fetching current state of the live chain. Please wait, it can take a while depending on the size of your chain.'));
	let at = (await api.rpc.chain.getBlockHash()).toString();
	progressBar.start(totalChunks, 0);
	const stream = fs.createWriteStream(storagePath, { flags: 'a' });
	stream.write("[");
	await fetchChunks("0x", chunksLevel, stream, at);
	stream.write("]");
	stream.end();
	progressBar.stop();
    }

    const metadata = await api.rpc.state.getMetadata();
    // Populate the prefixes array
    const modules = metadata.asLatest.pallets;
    modules.forEach((module) => {
	if (module.storage) {
	    if (!skippedModulesPrefix.includes(module.name)) {
		prefixes.push(xxhashAsHex(module.name, 128));
	    }
	}
    });

    // Generate chain spec for original and forked chains
    if (originalChain == '') {
	execSync(binaryPath + ` build-spec --raw > ` + originalSpecPath);
    } else {
	execSync(binaryPath + ` build-spec --chain ${originalChain} --raw > ` + originalSpecPath);
    }
    if (forkChain == '') {
	execSync(binaryPath + ` build-spec --dev --raw > ` + forkedSpecPath);
    } else {
	execSync(binaryPath + ` build-spec --chain ${forkChain} --raw > ` + forkedSpecPath);
    }

    let storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    let originalSpec = JSON.parse(fs.readFileSync(originalSpecPath, 'utf8'));
    let forkedSpec = JSON.parse(fs.readFileSync(forkedSpecPath, 'utf8'));

    // Modify chain name and id
    forkedSpec.name = originalSpec.name + '-fork';
    forkedSpec.id = originalSpec.id + '-fork';
    forkedSpec.protocolId = originalSpec.protocolId;

    // Grab the items to be moved, then iterate through and insert into storage
    storage
	.results
	.filter((i) => prefixes.some((prefix) => i[0].startsWith(prefix)))
	.forEach(([key, value]) => (forkedSpec.genesis.raw.top[key] = value));

    // Delete System.LastRuntimeUpgrade to ensure that the on_runtime_upgrade event is triggered
    delete forkedSpec.genesis.raw.top['0x26aa394eea5630e07c48ae0c9558cef7f9cce9c888469bb1a0dceaa129672ef8'];

    fixParachinStates(api, forkedSpec);

    // Set the code to the current runtime code
    forkedSpec.genesis.raw.top['0x3a636f6465'] = '0x' + fs.readFileSync(hexPath, 'utf8').trim();

    // To prevent the validator set from changing mid-test, set Staking.ForceEra to ForceNone ('0x02')
    forkedSpec.genesis.raw.top['0x5f3e4907f716ac89b6347d15ececedcaf7dad0317324aecae8744b87fc95f2f3'] = '0x02';

    if (alice !== '') {
	// Set sudo key to //Alice
	forkedSpec.genesis.raw.top['0x5c0d1176a568c1f92944340dbfed9e9c530ebca703c85910e7164cb7d1c9e47b'] = '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';
    }

    fs.writeFileSync(forkedSpecPath, JSON.stringify(forkedSpec, null, 4));

    console.log('Forked genesis generated successfully. Find it at ./data/fork.json');
    process.exit();
}

main();

