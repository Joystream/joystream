/**
 * This file contains constant/s that is being imported in test/network-tests package
 * The issue is that adding this constant in `query-node/mappings/src/common.ts` or
 * `query-node/mappings/src/content/utils.ts` and then importing in `tests/network-tests/src/Api.ts`
 * resulting in the following error while running tests using `./query-node/run-tests.sh`
 *
 * $ ./run-test-scenario.sh content-directory
 * $ node -r ts-node/register --unhandled-rejections=strict src/scenarios/content-directory.ts
 * Error: Config: WARTHOG_APP_HOST is required: undefined
 *
 * Possible reason of the error is likely that something inside of common.ts(it's also imported
 * by utils.ts) is imported with a unexpected side effect that creates the error.
 */

// magic constant used to convert Nft royalty to correct value
export const PERBILL_ONE_PERCENT = 10_000_000
