import fs = require("fs");
import path = require("path");
import { xxhashAsHex } from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from '@polkadot/api';
const execSync = require('child_process').execSync;

// paths & env variables
let alice = process.env.SUDO_ACCOUNT
// bad error handling TODO: fix process.env
let schemaPath = path.join(process.env.DATA_PATH || "", 'schema.json');
let wasmPath = path.join(process.env.DATA_PATH || "", 'runtime.wasm') || "";
let hexPath = path.join(process.env.DATA_PATH || "", 'runtime.hex') || "";
let specPath = path.join(process.env.DATA_PATH || "", 'chain-spec-raw.json');
let storagePath = path.join(process.env.DATA_PATH || "", 'storage.json');

// this might not be of much use
const provider = new WsProvider(process.env.WS_RPC_ENDPOINT || 'http://localhost:9944')
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

// Apparently not needed: To review
// async function fixParachinStates(api: ApiPromise, chainSpec: any) {
//     const skippedKeys = [
//         api.query["parasScheduler"].sessionStartBlock.key()
//     ];
//     for (const k of skippedKeys) {
//         delete chainSpec.genesis.raw.top[k];
//     }
// }

async function main() {

    // hexdump of runtime wasm binary, running it from the shell gives bad format error
    execSync('cat ' + wasmPath + ' | hexdump -ve \'/1 "%02x"\' > ' + hexPath);

    let api;
    if (!fs.existsSync(schemaPath)) {
        console.log(('Custom Schema missing, using default schema.'));
        api = await ApiPromise.create({ provider });
    } else {
        const types = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        api = await ApiPromise.create({
            provider,
            types,
        });
    }

    // storage.json is guaranteed to exists

    let metadata = await api.rpc.state.getMetadata();
    // Populate the prefixes array
    let modules = metadata.asLatest.modules;
    modules.forEach((module) => {
        if (module.storage) {
            if (!skippedModulesPrefix.includes(module.name.toString())) {
                prefixes.push(xxhashAsHex(module.name.toString(), 128));
            }
        }
    });

    // blank starting chainspec guaranteed to exist

    let storage: Storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    let chainSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

    // Modify chain name and id
    chainSpec.name = chainSpec.name + '-fork';
    chainSpec.id = chainSpec.id + '-fork';
    chainSpec.protocolId = chainSpec.protocolId;

    // Grab the items to be moved, then iterate through and insert into storage
    storage
        .result
        .filter((i) => prefixes.some((prefix) => i[0].startsWith(prefix)))
        .forEach(([key, value]) => (chainSpec.genesis.raw.top[key] = value));

    // Delete System.LastRuntimeUpgrade to ensure that the on_runtime_upgrade event is triggered
    delete chainSpec.genesis.raw.top['0x26aa394eea5630e07c48ae0c9558cef7f9cce9c888469bb1a0dceaa129672ef8'];

    //    fixParachinStates(api, chainSpec);

    // Set the code to the current runtime code: this replaces the set code transaction
    chainSpec.genesis.raw.top['0x3a636f6465'] = '0x' + fs.readFileSync(hexPath, 'utf8').trim();

    // To prevent the validator set from changing mid-test, set Staking.ForceEra to ForceNone ('0x02')
    chainSpec.genesis.raw.top['0x5f3e4907f716ac89b6347d15ececedcaf7dad0317324aecae8744b87fc95f2f3'] = '0x02';

    if (alice !== '') {
        // Set sudo key to //Alice
        chainSpec.genesis.raw.top['0x5c0d1176a568c1f92944340dbfed9e9c530ebca703c85910e7164cb7d1c9e47b'] = '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';
    }

    fs.writeFileSync(specPath, JSON.stringify(chainSpec, null, 4));

    console.log('****** INITIAL CHAINSPEC UPDATED TO REFLECT LIVE STATE ******');
    process.exit();
}

main();



interface Storage {
    "jsonrpc": string,
    "result": Array<[string, string]>,
    "id": string,
}

