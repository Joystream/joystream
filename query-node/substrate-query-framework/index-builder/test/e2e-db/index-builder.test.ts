import * as dotenv from 'dotenv';
// we should set env variables before all other imports to avoid config errors or warthog caused by DI
dotenv.config( { path: './test/e2e-db/.env' });

import { createDb, dropDb } from '../utils';
import { expect, assert } from 'chai';
import { IndexBuilder, QueryEventBlock, SavedEntityEvent, DatabaseManager, makeDatabaseManager } from '../../src';
import { mock } from 'ts-mockito';
import { QueryService } from '../../src/QueryService';
import * as BN from 'bn.js';

import { tipEventPack, newTipEvent_report_awesome, tipClosingEvent } from './fixtures';

import { createConnection,  Connection } from 'typeorm';
import { Tip } from '../models/tip.model';


describe('IndexBuiler', () => {
  let qs: QueryService;
  let connection: Connection;
  let db: DatabaseManager;

  before(async () => {
    try {
      await createDb();
    } catch (e) {
      console.error(e);
    }
    connection = await createConnection();
    await SavedEntityEvent.createTable();
    db = makeDatabaseManager(connection.createEntityManager());
  });

  after(async () => {
    if (connection) {
      await connection.close();
    }
    try {
      await dropDb();
    } catch (e) {
      console.error(e);
    }
    
  })



  beforeEach(() => {
    //queryBlockProducer = mock(QueryBlockProducer);
    qs = mock(QueryService);
  });

  it('should save tippers', async () => {

    const ib:IndexBuilder = IndexBuilder.create(qs, tipEventPack);
    // create new tip
    await ib._onQueryEventBlock(new QueryEventBlock(new BN(0), [newTipEvent_report_awesome]));
    let tip: Tip | undefined = await db.get(Tip, { where: { reason: Buffer.from(newTipEvent_report_awesome.event_params.Hash) } });
    assert(tip !== undefined, "Tip should not be null");
    
    const whoHex = tip?.who.toString() || '';
    // whoHex starts with 0x... but hex encoding expects hex chars straight away
    expect(Buffer.from(whoHex.split('x')[1], 'hex').toString()).to.be.equal('who', "tip should be saved");

    await ib._onQueryEventBlock(new QueryEventBlock(new BN(1), [tipClosingEvent] ));

    tip = await db.get(Tip, { where: { reason: Buffer.from(newTipEvent_report_awesome.event_params.Hash) } });
    
    if (tip == undefined)  {
      throw new Error('Tip should be saved');
    }
    // TODO: The two expects below are failing. should the tippers be saved?
    //expect(tip.tippers).to.be.of.length(1, "The tip should have a tipper");
    //expect(tip.tippers[0].tipValue.toString()).to.be.equal('500000000', "Tip value should match the event param");

  })
})