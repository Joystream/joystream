import Debug from 'debug';
import { ExponentialBackOffStrategy, BackoffStrategy } from './BackOffStategy';
import { logError } from './errors';

export const POLL_INTERVAL_MS = 100;
export const DEFAULT_FETCH_TIMEOUT_MS = 500;


const debug = Debug('index-builder:util');

/**
 * Resolves when an async call resolves to true, and rejects if any call rejects.
 * 
 * 
 * @param condition Async condition to be satisfied
 * @param exit Force exit handle
 * @param pollInterval 
 */
export async function waitForAsync(condition: () => Promise<boolean>, exit?: () => boolean, pollInterval = POLL_INTERVAL_MS): Promise<void> {
  let cond = await condition(); 
  while (!cond) {
    await sleep(pollInterval);
    cond = await condition();
    if (exit && exit()) {
      return;
    }
  }
}

/**
 * Returns a promise which resolves when a certain condition is met
 * 
 * @param condition The promise resolves when `condition()` returns true
 * @param exit (optional) The promise rejects if exit() returns true
 * @param pollInterval (optimal) The sleep interval
 */
export async function waitFor(condition: () => boolean, exit?: () => boolean, pollInterval = POLL_INTERVAL_MS): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let timeout: NodeJS.Timeout | undefined = undefined;   
    const checkCondition = () => {
      if (exit && exit()) {
        if (timeout) {
          clearTimeout(timeout);
        }
        reject("The exit condition has been triggered")
        return;
      }
          
      if (condition()) {
        if (timeout) {
          clearTimeout(timeout);
        }
        resolve()
      } else {
        timeout = setTimeout(checkCondition, pollInterval);
      }    

    }
    checkCondition();
  });
}

/**
 * Sleep for a given amount of milliseconds
 * 
 * @param time For how long to sleep
 */
export async function sleep(timeMS: number): Promise<void> {
  await new Promise((resolve)=>setTimeout(() => {
    resolve();
  }, timeMS));
}

/*
 * Await for the promise or reject after a timeout
 */
export async function withTimeout<T>(promiseFn: Promise<T>, rejectMsg?: string, timeoutMS?: number): Promise<T> {
    // Create a promise that rejects in <ms> milliseconds
  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(`${rejectMsg || 'Execution time-out'}`);
    }, timeoutMS || DEFAULT_FETCH_TIMEOUT_MS)
  });

    // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promiseFn,
    timeoutPromise
  ]).then(x => x as T);
}

/**
 * Tries to resolve the given promise multiple times; gives up after the given number of retries.
 * If the number of retries is `-1` (default), then it retries ad infinitum.
 * 
 * @param promiseFn Promise to resolve
 * @param retries Number of retries or -1 for infinite number of retries;
 */
export async function retry<T>(promiseFn: () => Promise<T>, retries = -1, backoff: BackoffStrategy = new ExponentialBackOffStrategy()): Promise<T> {
  let result: T | undefined = undefined;
  let _ret = retries;
  let error: Error | undefined = undefined;

  while (result === undefined && _ret !== 0) {
    try {
      result = await promiseFn();
      backoff.resetBackoffTime();
      return result;
    } catch (e) {
      error = new Error(e);
      await sleep(backoff.getBackOffMs());
      debug(`An error occured: ${JSON.stringify(e, null, 2)}. Retrying in ${backoff.getBackOffMs()}ms. 
            Number of retries left: ${_ret}`);
      _ret = _ret > 0 ? _ret -1 : _ret;
      backoff.registerFailure();
    }
  }
  backoff.resetBackoffTime();
  throw new Error(`Failed to resolve promise after ${retries}. Last error: ${logError(error)}`);
}

export async function retryWithTimeout<T>(promiseFn: () => Promise<T>, timeout: number, retries = -1, backoff: BackoffStrategy = new ExponentialBackOffStrategy()): Promise<T> {
  return await retry (() => {
    const prom = promiseFn();
    return withTimeout(prom, `Timed out: ${timeout} ms`, timeout)
  }, retries, backoff)
   
}