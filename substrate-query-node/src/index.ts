import "reflect-metadata";
import { WsProvider, ApiPromise } from "@polkadot/api";
import { registerJoystreamTypes } from "@joystream/types";
import { EventRecord } from "@polkadot/types/interfaces";
import { Vec } from "@polkadot/types";
import { createConnection } from "typeorm";

import { initConfig, typeOrmConfigName } from "./config";
import { dispatch } from "./dispatch";

async function main() {
  // Load envs
  initConfig();

  // type orm db connection
  await createConnection(typeOrmConfigName);

  registerJoystreamTypes();

  const nodeUrl: string = process.env.NODE_URL!;
  const provider = new WsProvider(nodeUrl);
  const api = await ApiPromise.create({ provider });

  console.log("Listening Joystream events...");
  api.query.system.events((events: Vec<EventRecord>) => {
    // loop through the Vec<EventRecord>
    events.forEach((record: EventRecord) => {
      // extract the phase, event and the event types
      const { event } = record;
      console.log(`Event====>>> ${event.section}:${event.method}`);
      if (event.section === "members") {
        dispatch(event);
      }
    });
  });

  //api.disconnect();
}

main();
