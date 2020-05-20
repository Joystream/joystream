import { BootstrapPack, BootstrapFunc, SubstrateEvent } from '..';
import { WsProvider, ApiPromise } from '@polkadot/api';
import { createConnection, getConnection, EntityManager } from 'typeorm';
import { DB, SavedEntityEvent } from '../db';

const debug = require('debug')('index-builder:bootstrapper');

export default class Bootstrapper {

    private _api: ApiPromise;
    private _bootstrapPack: BootstrapPack;

    private constructor(api: ApiPromise, 
        bootstrapPack: BootstrapPack) {
        this._api = api;
        this._bootstrapPack = bootstrapPack;
    }

    static async create(
        ws_provider_endpoint_uri: string,
        bootstrapPack: BootstrapPack,
        type_registrator: () => void): Promise<Bootstrapper> {
        // Initialise the provider to connect to the local node
        const provider = new WsProvider(ws_provider_endpoint_uri);

        // Register types before creating the api
        type_registrator();

        // Create the API and wait until ready
        const api = await ApiPromise.create({ provider });
        return new Bootstrapper(api, bootstrapPack);
    }

    async bootstrap() {
        debug("Bootstraping the database");
        const queryRunner = getConnection().createQueryRunner();
        const api = this._api;
        await queryRunner.connect();
        
        try {
            await queryRunner.startTransaction();
            // establish real database connection
            // perform all the bootstrap logic in one large
            // atomic transaction 
            for (const boot of this._bootstrapPack.pack) {
                let shouldBootstrap = await this.shouldBootstrap(queryRunner.manager, boot);
                if (!shouldBootstrap) {
                    debug(`${boot.name} already bootstrapped, skipping`);
                    continue;
                }

                let bootEvent = this.createBootEvent(boot);
                
                let db = new DB(bootEvent, queryRunner.manager);
                await boot(api, db);

                // Save the bootstrap events so 
                await SavedEntityEvent.update(bootEvent, queryRunner.manager);
            }

            debug("Database bootstrap successfull");
            await queryRunner.commitTransaction();

        } catch (error) {
            console.error(error);
            await queryRunner.rollbackTransaction();
            throw new Error(`Bootstrapping failed: ${error}`);
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
            event_method: boot.name,
            event_params: {},
            index: Date.now() / 1000 | 0, // simply put the timestamp here
            block_number: process.env.BLOCK_HEIGHT ? parseInt(process.env.BLOCK_HEIGHT) : 0, 
        };
    }

    /**
     * Looksup the saved boot events to find out if the given handler has already
     * bootstrapped the data
     * 
     * @param em  `EntityManager` by `typeorm`
     * @param boot boothandler
     */
    private async shouldBootstrap(em: EntityManager, boot: BootstrapFunc):Promise<boolean> {
        const event = await em.findOne(SavedEntityEvent, { 
            where: { 
                eventName: 'Bootstrap', 
                index: boot.name
            }
        })
        return event ? false : true;
    }
}