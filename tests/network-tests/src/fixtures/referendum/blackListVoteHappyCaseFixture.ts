import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { Api } from "src/Api";
import { StandardizedFixture } from "src/Fixture";
import { QueryNodeApi } from "src/QueryNodeApi";
import { EventDetails, AnyQueryNodeEvent } from "src/types";

export class BlackListVoteHappyCaseFixture extends StandardizedFixture {
    private accounts: string[]
    constructor(api: Api, query: QueryNodeApi, accounts: string[]) {
        super(api, query)
        this.accounts = accounts
    }
    protected getSignerAccountOrAccounts(): Promise<string | string[]> {
        return new Promise(() => this.accounts)
        // throw new Error("Method not implemented.");
    }
    protected getExtrinsics(): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>[] | SubmittableExtrinsic<"promise", ISubmittableResult>[][]> {
        // return this.api.tx.referendum.
        throw new Error("Method not implemented.");
    }
    protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails<unknown>> {
        throw new Error("Method not implemented.");
    }
    protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
        super.assertQueryNodeEventsAreValid(qEvent, i )
    }
}