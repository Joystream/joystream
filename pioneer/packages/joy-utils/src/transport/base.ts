import { ApiPromise } from '@polkadot/api';

export default abstract class BaseTransport {
  protected api: ApiPromise;

  constructor (api: ApiPromise) {
    this.api = api;
  }

  protected get proposalsEngine () {
    return this.api.query.proposalsEngine;
  }

  protected get proposalsCodex () {
    return this.api.query.proposalsCodex;
  }

  protected get members () {
    return this.api.query.members;
  }

  protected get council () {
    return this.api.query.council;
  }

  protected get councilElection () {
    return this.api.query.councilElection;
  }

  protected get actors () {
    return this.api.query.actors;
  }

  protected get contentWorkingGroup () {
    return this.api.query.contentWorkingGroup;
  }

  protected get minting () {
    return this.api.query.minting;
  }
}
