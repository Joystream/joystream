'use strict';

const debug = require('debug')('joystream:substrate:base');

const { registerJoystreamTypes } = require('joystream/substrate/types');
const { ApiPromise } = require('@polkadot/api');

/*
 * Initialize substrate API and keyring.
 */
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

  /*
   * Wait for an event. Filters out any events that don't match the module and
   * event name.
   *
   * The result of the Promise is an array containing first the full event
   * name, and then the event fields as an object.
   */
  async waitForEvent(module, name)
  {
    return this.waitForEvents([[module, name]]);
  }

  /*
   * Same as waitForEvent, but filter on multiple events. The parameter is an
   * array of arrays containing module and name. Calling waitForEvent is
   * identical to calling this with [[module, name]].
   *
   * Returns the first matched event *only*.
   */
  async waitForEvents(subscribed)
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
          const matching = subscribed.filter((value) => {
            return event.section == value[0] && event.method == value[1];
          });
          if (matching.length <= 0) {
            return;
          }

          // loop through each of the parameters, displaying the type and data
          const payload = {};
          event.data.forEach((data, index) => {
            debug(`\t\t\t${types[index].type}: ${data.toString()}`);
            payload[types[index].type] = data;
          });

          const full_name = `${event.section}.${event.method}`;
          resolve([full_name, payload]);
        });
      });
    });

  }
}

module.exports = {
  SubstrateApi: SubstrateApi,
}
