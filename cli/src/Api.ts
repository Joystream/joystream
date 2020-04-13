import BN from 'bn.js';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';
import { Balance, Hash } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';
import { Codec } from '@polkadot/types/types';
import { AccountBalances, CouncilInfoObj, CouncilInfoTuple, AccountSummary, createCouncilInfoObj } from './Types';
import { DerivedFees, DerivedBalances } from '@polkadot/api-derive/types';
import { CLIError } from '@oclif/errors';
import ExitCodes from './ExitCodes';

const API_URL = process.env.WS_URL || (
    process.env.MAIN_TESTNET ?
        'wss://rome-rpc-endpoint.joystream.org:9944/'
        : 'wss://rome-staging-2.joystream.org/staging/rpc/'
);
const TOKEN_SYMBOL = 'JOY';

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future

export default class Api {
    private _api: ApiPromise;

    private constructor(originalApi:ApiPromise) {
        this._api = originalApi;
    }

    private static async initApi(): Promise<ApiPromise> {
        formatBalance.setDefaults({ unit: TOKEN_SYMBOL });
        const wsProvider:WsProvider = new WsProvider(API_URL);
        registerJoystreamTypes();

        return await ApiPromise.create({ provider: wsProvider });
    }

    static async create(): Promise<Api> {
        const originalApi: ApiPromise = await Api.initApi();
        return new Api(originalApi);
    }

    private async queryMultiOnce(queries: Parameters<typeof ApiPromise.prototype.queryMulti>[0]): Promise<Codec[]> {
        let results: Codec[] = [];

        const unsub = await this._api.queryMulti(
            queries,
            (res) => { results = res }
        );
        unsub();

        if (!results.length || results.length !== queries.length) {
            throw new CLIError('API querying issue', { exit: ExitCodes.ApiError });
        }
            return results;
    }

    async getAccountsBalancesInfo(accountAddresses:string[]): Promise<AccountBalances[]> {
        let apiQueries:any = [];
        for (let address of accountAddresses) {
            apiQueries.push([this._api.query.balances.freeBalance, address]);
            apiQueries.push([this._api.query.balances.reservedBalance, address]);
        }

        let balances: AccountBalances[] = [];
        let balancesRes = await this.queryMultiOnce(apiQueries);
        for (let key in accountAddresses) {
            let numKey: number = parseInt(key);
            const free: Balance = <Balance> balancesRes[numKey*2];
            const reserved: Balance = <Balance> balancesRes[numKey*2 + 1];
            const total: Balance = this._api.createType('Balance', free.add(reserved));
            balances[key] = { free, reserved, total };
        }

        return balances;
    }

    // Get on-chain data related to given account.
    // For now it's just account balances
    async getAccountSummary(accountAddresses:string): Promise<AccountSummary> {
        const balances: DerivedBalances = await this._api.derive.balances.all(accountAddresses);

        return { balances };
    }

    async getCouncilInfo(): Promise<CouncilInfoObj> {
        const results = await this.queryMultiOnce([
            this._api.query.council.activeCouncil,
            this._api.query.council.termEndsAt,
            this._api.query.councilElection.autoStart,
            this._api.query.councilElection.newTermDuration,
            this._api.query.councilElection.candidacyLimit,
            this._api.query.councilElection.councilSize,
            this._api.query.councilElection.minCouncilStake,
            this._api.query.councilElection.minVotingStake,
            this._api.query.councilElection.announcingPeriod,
            this._api.query.councilElection.votingPeriod,
            this._api.query.councilElection.revealingPeriod,
            this._api.query.councilElection.round,
            this._api.query.councilElection.stage
        ]);

        let infoObj: CouncilInfoObj = createCouncilInfoObj(...(<CouncilInfoTuple> results));

        return infoObj;
    }

    // TODO: This formula is probably not too good, so some better implementation will be required in the future
    async estimateFee(account: KeyringPair, recipientAddr: string, amount: BN): Promise<BN> {
        const transfer = this._api.tx.balances.transfer(recipientAddr, amount);
        const signature = account.sign(transfer.toU8a());
        const transactionByteSize:BN = new BN(transfer.encodedLength + signature.length);

        const fees: DerivedFees = await this._api.derive.balances.fees();

        const estimatedFee = fees.transactionBaseFee.add(fees.transactionByteFee.mul(transactionByteSize));

        return estimatedFee;
    }

    async transfer(account: KeyringPair, recipientAddr: string, amount: BN): Promise<Hash> {
        const txHash = await this._api.tx.balances
            .transfer(recipientAddr, amount)
            .signAndSend(account);
        return txHash;
    }
}
