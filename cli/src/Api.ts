import BN from 'bn.js';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { QueryableStorageMultiArg } from '@polkadot/api/types';
import { formatBalance } from '@polkadot/util';
import { Balance, Hash } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';
import { Codec } from '@polkadot/types/types';
import { AccountBalances, AccountSummary, CouncilInfoObj, CouncilInfoTuple, createCouncilInfoObj } from './Types';
import { DerivedFees, DerivedBalances } from '@polkadot/api-derive/types';
import { CLIError } from '@oclif/errors';
import ExitCodes from './ExitCodes';

export const DEFAULT_API_URI = 'wss://rome-rpc-endpoint.joystream.org:9944/';
export const TOKEN_SYMBOL = 'JOY';

// Api wrapper for handling most common api calls and allowing easy API implementation switch in the future

export default class Api {
    private _api: ApiPromise;

    private constructor(originalApi:ApiPromise) {
        this._api = originalApi;
    }

    public getOriginalApi(): ApiPromise {
        return this._api;
    }

    private static async initApi(apiUri: string = DEFAULT_API_URI): Promise<ApiPromise> {
        formatBalance.setDefaults({ unit: TOKEN_SYMBOL });
        const wsProvider:WsProvider = new WsProvider(apiUri);
        registerJoystreamTypes();

        return await ApiPromise.create({ provider: wsProvider });
    }

    static async create(apiUri: string = DEFAULT_API_URI): Promise<Api> {
        const originalApi: ApiPromise = await Api.initApi(apiUri);
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
        const queries: { [P in keyof CouncilInfoObj]: QueryableStorageMultiArg<"promise"> } = {
            activeCouncil:    this._api.query.council.activeCouncil,
            termEndsAt:       this._api.query.council.termEndsAt,
            autoStart:        this._api.query.councilElection.autoStart,
            newTermDuration:  this._api.query.councilElection.newTermDuration,
            candidacyLimit:   this._api.query.councilElection.candidacyLimit,
            councilSize:      this._api.query.councilElection.councilSize,
            minCouncilStake:  this._api.query.councilElection.minCouncilStake,
            minVotingStake:   this._api.query.councilElection.minVotingStake,
            announcingPeriod: this._api.query.councilElection.announcingPeriod,
            votingPeriod:     this._api.query.councilElection.votingPeriod,
            revealingPeriod:  this._api.query.councilElection.revealingPeriod,
            round:            this._api.query.councilElection.round,
            stage:            this._api.query.councilElection.stage
        }
        const results: CouncilInfoTuple = <CouncilInfoTuple> await this.queryMultiOnce(Object.values(queries));

        return createCouncilInfoObj(...results);
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
