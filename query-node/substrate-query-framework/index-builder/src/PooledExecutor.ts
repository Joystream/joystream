// This is a modified version of 
// https://github.com/rodrigogs/promise-pool/blob/master/index.js
// h/t @rodrigogs

/**
 * This promise pool keeps looping `Promise.all`'s promises until the last generator
 * item is submitted to the processor.
 *
 * @example
 * const promisePool = require('@rodrigogs/promisePool');
 *
 * function* generatorFunction(start, end) { // Could be an async generator
 *   for (let i = start; i <= end; i += 1) {
 *     yield i;
 *   }
 * }
 *
 * function processor(generatorValue) { // Could be an async function
 *   console.log(generatorValue);
 * }
 *
 * await promisePool({
 *   generator: generatorFunction(100, 1000),
 *   processor,
 *   concurrency: 10,
 * });
 *
 * @generator
 * @function promisePool
 * @param {Object} options Options object
 * @param {Generator|AsyncGenerator} options.generator Initialized generator or
 * async generator object to feed the poller
 * @param {Function} options.processor This function will be concurrently executed
 * against each generator value.
 * If a `false` value is strictly returned from the processor function, its very `thread` dies.
 * The poller is able to resolve promises, so it can be an async function.
 * @param {Number} options.concurrency Number of parallel processors running simultaneously.
 * @param {Function} [options.killer=undefined] An optional killer function to interrupt the poller
 * from an outside scope.
 * This function will be called in every iteration and once it returns `true` the `threads`
 * will begin to stop after finishing the current processor. This can be an async function.
 * @returns {Promise<void>}
 */
import Debug from 'debug';
const debug = Debug('index-builder:pooled-executor');


export class PooledExecutor<T, R, N> {
  
  constructor(public readonly concurrency: number, 
    public readonly generator: AsyncGenerator<T, R, N>,
    public readonly processor: (v: T | R) => Promise<void> ) {
  }

  public async run(killer?: () => boolean): Promise<void> {
    const queue = Array(this.concurrency).fill(null);

    let stop = false;

    const poller = async () => {
      do {
        let next = undefined;
        try {
          next = await this.generator.next();
        } catch (e) {
          console.error(e);
          debug(`Error getting next generator value: ${JSON.stringify(next, null, 2)}`);
        }
        if (next == undefined || next.done === true) {
          debug('Generator is done, exiting');
          return;
        }

        let result = true;
        try {
          await this.processor(next.value);
        } catch (e) {
          console.error(e);
          debug(`Error during execution: ${JSON.stringify(e, null, 2)}`);
          result = false;
        } 

        if (result === false || killer && killer()) {
          debug(`Stopping the executor`);
          stop = true;
        }
      } while (!stop);
    };

    await Promise.all(queue.map(poller));
  }
}



