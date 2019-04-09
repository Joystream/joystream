'use strict';

const debug = require('debug')('joystream:substrate:base');

const { registerJoystreamTypes } = require('joystream/substrate/types');
const { ApiPromise } = require('@polkadot/api');

class SubstrateApi
{
  static async create()
  {
    const ret = new SubstrateApi();
    await ret.init();
    return ret;
  }

  async init()
  {
    debug('Init');

    // Register joystream types
    registerJoystreamTypes();

    // Create the API instrance
    this.api = await ApiPromise.create();
  }

  async waitForEvent(module, name)
  {
    return new Promise((resolve, reject) => {
      this.api.query.system.events((events) => {
        debug(`Number of events: ${events.length}`);
        events.forEach((record) => {
          // extract the phase, event and the event types
          const { event, phase } = record;
          const types = event.typeDef;

          // show what we are busy with
          debug(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
          debug(`\t\t${event.meta.documentation.toString()}`);

          // Skip events we're not interested in.
          if (event.section != module || event.method != name) {
            // Nothing to do here.
            return;
          }

          // loop through each of the parameters, displaying the type and data
          const payload = {};
          event.data.forEach((data, index) => {
            debug(`\t\t\t${types[index].type}: ${data.toString()}`);
            payload[types[index].type] = data;
          });

          const full_name = `${module}.${name}`;
          resolve([full_name, payload]);
        });
      });
    });
  }
}

module.exports = {
  SubstrateApi: SubstrateApi,
}
