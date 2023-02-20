import { Api } from './Api'
import { assert } from 'chai'
import { ISubmittableResult } from '@polkadot/types/types/'
import { DispatchResult } from '@polkadot/types/interfaces/system'
import { QueryNodeApi } from './QueryNodeApi'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { extendDebug, Debugger } from './Debugger'
import { AnyQueryNodeEvent, EventDetails } from './types'
import { BN } from 'bn.js'

export abstract class BaseFixture {
  protected readonly api: Api
  protected debug: Debugger.Debugger
  private _executed = false
  // The reason of the "Unexpected" failure of running the fixture
  private _err: Error | undefined = undefined

  constructor(api: Api) {
    this.api = api
    this.debug = extendDebug(`fixture:${this.constructor.name}`)
  }

  // Derviced classes must not override this
  public async runner(): Promise<void> {
    await this.execute()
    this._executed = true
  }

  abstract execute(): Promise<void>

  // Used by execution implementation to signal failure
  protected error(err: Error): void {
    this._err = err
  }

  get executed(): boolean {
    return this._executed
  }

  public didFail(): boolean {
    if (!this.executed) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this._err !== undefined
  }

  public executionError(): Error | undefined {
    if (!this.executed) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this._err
  }

  protected expectDispatchError(result: ISubmittableResult, errMessage: string): ISubmittableResult {
    const success = result.findRecord('system', 'ExtrinsicSuccess')

    if (success) {
      this.error(new Error(errMessage))
    }

    return result
  }

  protected expectDispatchSuccess(result: ISubmittableResult, errMessage: string): ISubmittableResult {
    const success = result.findRecord('system', 'ExtrinsicSuccess')

    if (!success) {
      this.error(new Error(errMessage))
      // Log DispatchError
    }

    return result
  }
}

export abstract class BaseQueryNodeFixture extends BaseFixture {
  protected readonly query: QueryNodeApi
  public readonly queryNodeChecksEnabled: boolean

  constructor(api: Api, query: QueryNodeApi) {
    super(api)
    this.query = query
    this.queryNodeChecksEnabled = !process.env.SKIP_QUERY_NODE_CHECKS
  }

  public async runQueryNodeChecks(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot run query node checks before Fixture is executed')
    }
    // Implement in child class!
  }

  protected findMatchingQueryNodeEvent<T extends AnyQueryNodeEvent>(
    eventToFind: EventDetails,
    queryNodeEvents: T[]
  ): T {
    const { blockNumber, indexInBlock } = eventToFind
    const qEvent = queryNodeEvents.find((e) => e.inBlock === blockNumber && e.indexInBlock === indexInBlock)
    if (!qEvent) {
      throw new Error(`Could not find matching query-node event (expected ${blockNumber}:${indexInBlock})!`)
    }
    return qEvent
  }
}

export abstract class StandardizedFixture extends BaseQueryNodeFixture {
  protected extrinsics: SubmittableExtrinsic<'promise'>[] = []
  protected results: ISubmittableResult[] = []
  protected events: EventDetails[] = []
  protected decrementalTip = false
  protected expectedErrorName: string | undefined

  protected abstract getSignerAccountOrAccounts(): Promise<string | string[]>
  protected abstract getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[] | SubmittableExtrinsic<'promise'>[][]>
  protected abstract getEventFromResult(result: ISubmittableResult): Promise<EventDetails>
  protected abstract assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void

  protected assertQueryNodeEventsAreValid(qEvents: AnyQueryNodeEvent[], expectFailureAtIndexes: number[] = []): void {
    this.events.forEach((e, i) => {
      if (expectFailureAtIndexes.includes(i)) return
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      assert.equal(qEvent.inExtrinsic, this.extrinsics[i].hash.toString())
      assert.equal(new Date(qEvent.createdAt).getTime(), e.blockTimestamp)
      this.assertQueryNodeEventIsValid(qEvent, i)
    })
  }

  public setErrorName(errName: string) {
    this.expectedErrorName = errName
  }

  public async execute(): Promise<void> {
    const accountOrAccounts = await this.getSignerAccountOrAccounts()
    const extrinsics = await this.getExtrinsics()
    this.extrinsics = extrinsics.flat()
    const tip = this.decrementalTip ? new BN(100_000_000_000) : new BN(0)
    await this.api.prepareAccountsForFeeExpenses(accountOrAccounts, this.extrinsics, tip)
    this.results = await this.api.sendExtrinsicsAndGetResults(extrinsics, accountOrAccounts, tip)
    if (!this.expectedErrorName) {
      this.events = await Promise.all(this.results.map((r) => this.getEventFromResult(r)))
    } else {
      this.results.map((result) => {
        this.expectDispatchError(result, 'Error expected but extrinsic succeeded')
        const errName = this.api.getErrorNameFromExtrinsicFailedRecord(result)
        assert.deepEqual(errName, this.expectedErrorName, 'Wrong error observed')
      })
    }
  }
}

// Runs a fixture and measures how long it took to run
// Ensures fixture only runs once, and asserts that it doesn't fail
export class FixtureRunner {
  private fixture: BaseFixture
  private ran = false
  private queryNodeChecksRan = false

  constructor(fixture: BaseFixture) {
    this.fixture = fixture
  }

  public async run(): Promise<void> {
    if (this.ran) {
      throw new Error('Fixture already ran')
    }

    this.ran = true

    // TODO: record starting block

    await this.fixture.runner()
    // TODO: record ending block
    const err = this.fixture.executionError()
    assert.equal(err, undefined)
  }

  public async runQueryNodeChecks(): Promise<void> {
    if (process.env.SKIP_QUERY_NODE_CHECKS) {
      return
    }
    if (!(this.fixture instanceof BaseQueryNodeFixture)) {
      throw new Error('Tried to run query node checks for non-query-node fixture!')
    }
    if (this.queryNodeChecksRan) {
      throw new Error('Fixture query node checks already ran')
    }

    this.queryNodeChecksRan = true

    await this.fixture.runQueryNodeChecks()
  }

  public async runWithQueryNodeChecks(): Promise<void> {
    await this.run()
    await this.runQueryNodeChecks()
  }
}
