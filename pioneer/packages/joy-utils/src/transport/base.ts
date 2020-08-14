import { ApiPromise } from '@polkadot/api';
import { APIQueryCache } from './APIQueryCache';

export default abstract class BaseTransport {
  protected api: ApiPromise;
  protected cacheApi: APIQueryCache;

  constructor (api: ApiPromise, cacheApi: APIQueryCache) {
    this.api = api;
    this.cacheApi = cacheApi;
  }

  protected get proposalsEngine () {
    return this.cacheApi.query.proposalsEngine;
  }

  protected get proposalsCodex () {
    return this.cacheApi.query.proposalsCodex;
  }

  protected get proposalsDiscussion () {
    return this.cacheApi.query.proposalsDiscussion;
  }

  protected get members () {
    return this.cacheApi.query.members;
  }

  protected get council () {
    return this.cacheApi.query.council;
  }

  protected get councilElection () {
    return this.cacheApi.query.councilElection;
  }

  protected get actors () {
    return this.cacheApi.query.actors;
  }

  protected get contentWorkingGroup () {
    return this.cacheApi.query.contentWorkingGroup;
  }

  protected get minting () {
    return this.cacheApi.query.minting;
  }

  protected get hiring () {
    return this.cacheApi.query.hiring;
  }

  protected get stake () {
    return this.cacheApi.query.stake;
  }

  protected get recurringRewards () {
    return this.cacheApi.query.recurringRewards;
  }

  protected queryMethodByName (name: string) {
    const [module, method] = name.split('.');

    return this.api.query[module][method];
  }
}
