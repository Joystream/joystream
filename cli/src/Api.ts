import BN from 'bn.js';
import { registerJoystreamTypes } from '@joystream/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';
import { Balance, Hash } from '@polkadot/types/interfaces';
import { KeyringPair } from '@polkadot/keyring/types';
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
    private _api: ApiPromise | null = null;
    private initializing: boolean = false;

    private async initApi(): Promise<ApiPromise> {
        formatBalance.setDefaults({ unit: TOKEN_SYMBOL });
        const wsProvider:WsProvider = new WsProvider(API_URL);
        registerJoystreamTypes();

        return await ApiPromise.create({ provider: wsProvider });
    }

    private async getApi(): Promise<ApiPromise> {
        while (this.initializing) {
            await new Promise((res,rej) => setTimeout(res, 10));
        }
        if (!this._api) {
            this.initializing = true;
            this._api = await this.initApi();
            this.initializing = false;
        }

        return this._api;
    }

    async getAccountsBalancesInfo(accountAddresses:string[]): Promise<AccountBalances[]> {
        const api: ApiPromise = await this.getApi();

        let apiQueries:any = [];
        for (let address of accountAddresses) {
            apiQueries.push([api.query.balances.freeBalance, address]);
            apiQueries.push([api.query.balances.reservedBalance, address]);
        }

        let balances: AccountBalances[] = [];
        const unsub = await api.queryMulti(
            apiQueries,
            (balancesRes) => {
                for (let key in accountAddresses) {
                    let numKey: number = parseInt(key);
                    const free: Balance = <Balance> balancesRes[numKey*2];
                    const reserved: Balance = <Balance> balancesRes[numKey*2 + 1];
                    const total: Balance = api.createType('Balance', free.add(reserved));
                    balances[key] = { free, reserved, total };
                }
            }
        );
        unsub();

        return balances;
    }

    // Get on-chain data related to given account.
    // For now it's just account balances
    async getAccountSummary(accountAddresses:string): Promise<AccountSummary> {
        const api: ApiPromise = await this.getApi();
        const balances: DerivedBalances = await api.derive.balances.all(accountAddresses);

        return { balances };
    }

    async getCouncilInfo(): Promise<CouncilInfoObj> {
        const api: ApiPromise = await this.getApi();
        let infoObj: CouncilInfoObj | null = null;
        const unsub = await api.queryMulti(
            [
                api.query.council.activeCouncil,
                api.query.council.termEndsAt,
                api.query.councilElection.autoStart,
                api.query.councilElection.newTermDuration,
                api.query.councilElection.candidacyLimit,
                api.query.councilElection.councilSize,
                api.query.councilElection.minCouncilStake,
                api.query.councilElection.minVotingStake,
                api.query.councilElection.announcingPeriod,
                api.query.councilElection.votingPeriod,
                api.query.councilElection.revealingPeriod,
                api.query.councilElection.round,
                api.query.councilElection.stage
            ],
            ((res) => {
                infoObj = createCouncilInfoObj(...(<CouncilInfoTuple> res));
            })
        );
        unsub();

        if (infoObj) return infoObj;
        // Probably never happens, but otherwise TS will see it as error
        else throw new CLIError('Unexpected API error', { exit: ExitCodes.ApiError });
    }

    // TODO: This formula is probably not too good, so some better implementation will be required in the future
    async estimateFee(account: KeyringPair, recipientAddr: string, amount: BN): Promise<BN> {
        const api: ApiPromise = await this.getApi();

        const transfer = api.tx.balances.transfer(recipientAddr, amount);
        const signature = account.sign(transfer.toU8a());
        const transactionByteSize:BN = new BN(transfer.encodedLength + signature.length);

        const fees: DerivedFees = await api.derive.balances.fees();

        const estimatedFee = fees.transactionBaseFee.add(fees.transactionByteFee.mul(transactionByteSize));

        return estimatedFee;
    }

    async transfer(account: KeyringPair, recipientAddr: string, amount: BN): Promise<Hash> {
        const api: ApiPromise = await this.getApi();

        const txHash = await api.tx.balances
            .transfer(recipientAddr, amount)
            .signAndSend(account);
        return txHash;
    }
}
