import * as dotenv from "dotenv";
import * as chalk from "chalk";
import * as figlet from "figlet";
import * as commander from "commander";
import * as path from "path";
import { configure, getLogger } from "log4js";

import {
  QueryNodeManager,
  DatabaseManager,
  SubstrateEvent,
} from "@joystream/hydra-indexer-lib/lib";

// Mappings use!
export { DatabaseManager as DB, getLogger, SubstrateEvent };

const logger = getLogger();

const withErrors = (command: (...args: any[]) => Promise<void>) => {
  return async (...args: any[]) => {
    try {
      await command(...args);
    } catch (e) {
      console.log(chalk.red(e.stack));
      process.exit(1);
    }
  };
};

const withEnvs = (command: () => Promise<void>) => {
  return async (opts: any) => {
    setUp(opts);
    await command();
  };
};

function main(): commander.Command {
  console.log(chalk.green(figlet.textSync("Query_node-Indexer")));
  const program = new commander.Command();
  const version = require("./package.json").version;

  program.version(version).description("Query_node Indexer");

  program
    .command("index")
    .option("-h, --height", "starting block height")
    .option("-e, --env <file>", ".env file location", "../../.env")
    .description("Index all events and extrinsics in the substrate chain")
    .action(withErrors(withEnvs(runIndexer)));

  program
    .command("process")
    .option("-h, --height", "starting block height")
    .option("-e, --env <file>", ".env file location", "../../.env")
    .description("Process the event and extrinsic mappings using the index")
    .action(withErrors(withEnvs(runProcessor)));

  program
    .command("migrate")
    .description("Create the indexer schema")
    .option("-e, --env <file>", ".env file location", "../../.env")
    .action(withErrors(withEnvs(runMigrations)));

  program.parse(process.argv);

  return program;
}

function setUp(opts: any) {
  // dotenv config
  dotenv.config();
  dotenv.config({ path: opts.env });

  if (opts.height) {
    process.env.BLOCK_HEIGHT = opts.height;
  } else if (!process.env.BLOCK_HEIGHT) {
    process.env.BLOCK_HEIGHT = "0";
  }

  //log4js config
  if (opts.logging) {
    configure(opts.logging);
  } else {
    // log4js default: DEBUG to console output;
    getLogger().level = "debug";
  }
}

async function runProcessor() {
  const node = new QueryNodeManager();
  const atBlock = process.env.BLOCK_HEIGHT;
  await node.process({
    atBlock: atBlock && atBlock !== "0" ? Number.parseInt(atBlock) : undefined,
    processingPack: require("../../mappings"),
    entities: [
      path.join(__dirname, "../graphql-server/src/modules/**/*.model.ts"),
    ],
    indexerEndpointURL: process.env.INDEXER_ENDPOINT_URL,
  });
}

async function runIndexer() {
  const node = new QueryNodeManager();
  const atBlock = process.env.BLOCK_HEIGHT;
  await node.index({
    wsProviderURI: process.env.WS_PROVIDER_ENDPOINT_URI || "",
    atBlock: atBlock && atBlock !== "0" ? Number.parseInt(atBlock) : undefined,
    types: process.env.TYPES_JSON
      ? (require(process.env.TYPES_JSON) as Record<
          string,
          Record<string, string>
        >)
      : {},
  });
}

async function runMigrations() {
  logger.info(`Running migrations`);
  await QueryNodeManager.migrate();
  // TODO: here should be TypeORM migrations...
}

main();
