import {
  BootstrapPack,
  BootstrapFunc,
  SubstrateEvent,
  SavedEntityEvent
} from '..';

import { WsProvider, ApiPromise } from '@polkadot/api';
import { getConnection, EntityManager } from 'typeorm';
import { makeDatabaseManager } from '..';

import Debug from 'debug';
import { BootstrapOptions } from '../QueryNodeStartOptions';
const debug = Debug('index-builder:bootstrapper');

export default class Bootstrapper {
  private _api: ApiPromise;
  private _bootstrapPack: BootstrapPack;

  private constructor(api: ApiPromise, bootstrapPack: BootstrapPack) {
    this._api = api;
    this._bootstrapPack = bootstrapPack;
  }

  static async create(options: BootstrapOptions): Promise<Bootstrapper> {
    const { wsProviderURI, typeRegistrator, processingPack } = options;

    // Initialise the provider to connect to the local node
    const provider = new WsProvider(wsProviderURI);

    // Register types before creating the api
    typeRegistrator ? typeRegistrator() : null;

    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });
    return new Bootstrapper(api, processingPack);
  }

  async bootstrap():Promise<void> {
    debug('Bootstraping the database');
    const queryRunner = getConnection().createQueryRunner();
    const api = this._api;
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();
      // establish real database connection
      // perform all the bootstrap logic in one large
      // atomic transaction
      for (const boot of this._bootstrapPack.pack) {
        const shouldBootstrap = await this.shouldBootstrap(queryRunner.manager, boot);
        if (!shouldBootstrap) {
          debug(`${boot.name} already bootstrapped, skipping`);
          continue;
        }

        const bootEvent = this.createBootEvent(boot);
        await boot(api, makeDatabaseManager(queryRunner.manager));

        // Save the bootstrap events so
        await SavedEntityEvent.update(bootEvent, queryRunner.manager);
      }

      debug('Database bootstrap successfull');
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Bootstrapping failed: ${JSON.stringify(error, null, 2)}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * This creates a generic bootstrap event for compatibility with DB
   * and bookeeping of successfull bootstrap events
   */
  private createBootEvent(boot: BootstrapFunc): SubstrateEvent {
    return {
      event_name: 'Bootstrap',
      event_method: `Bootstrap.${boot.name}`,
      event_params: {},
      index: (Date.now() / 1000) | 0, // simply put the timestamp here
      block_number: process.env.BLOCK_HEIGHT ? Number.parseInt(process.env.BLOCK_HEIGHT) : 0,
    };
  }

  /**
   * Looksup the saved boot events to find out if the given handler has already
   * bootstrapped the data
   *
   * @param em  `EntityManager` by `typeorm`
   * @param boot boothandler
   */
  private async shouldBootstrap(em: EntityManager, boot: BootstrapFunc): Promise<boolean> {
    const event = await em.findOne(SavedEntityEvent, {
      where: {
        eventName: `Bootstrap.${boot.name}`,
      },
    });
    return event ? false : true;
  }
}
