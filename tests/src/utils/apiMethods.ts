import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { Utils } from './utils';
import { UserInfo, PaidMembershipTerms } from '@joystream/types/lib/members';
import { Balance } from '@polkadot/types/interfaces';
import BN = require('bn.js');
import { SubmittableExtrinsic } from '@polkadot/api/types';

export class ApiMethods {
  public static async create(provider: WsProvider): Promise<ApiMethods> {
    const api = await ApiPromise.create({ provider });
    return new ApiMethods(api);
  }

  private readonly api: ApiPromise;
  constructor(api: ApiPromise) {
    this.api = api;
  }

  public close() {
    this.api.disconnect();
  }

  public async buyMembership(
    account: KeyringPair,
    paidTermsId: number,
    name: string,
    expectFailure = false
  ): Promise<void> {
    return Utils.signAndSend(
      this.api.tx.members.buyMembership(paidTermsId, new UserInfo({ handle: name, avatar_uri: '', about: '' })),
      account,
      await this.getNonce(account),
      expectFailure
    );
  }

  public getMembership(address: string): Promise<any> {
    return this.api.query.members.memberIdsByControllerAccountId(address);
  }

  public getBalance(address: string): Promise<Balance> {
    return this.api.query.balances.freeBalance<Balance>(address);
  }

  public async transferBalance(from: KeyringPair, to: string, amount: number, nonce: BN = new BN(-1)): Promise<void> {
    const _nonce = nonce.isNeg() ? await this.getNonce(from) : nonce;
    return Utils.signAndSend(this.api.tx.balances.transfer(to, amount), from, _nonce);
  }

  public getPaidMembershipTerms(paidTermsId: number): Promise<Option<PaidMembershipTerms>> {
    return this.api.query.members.paidMembershipTermsById<Option<PaidMembershipTerms>>(paidTermsId);
  }

  public getMembershipFee(paidTermsId: number): Promise<number> {
    return this.getPaidMembershipTerms(paidTermsId).then(terms => terms.unwrap().fee.toNumber());
  }

  public async transferBalanceToAccounts(
    from: KeyringPair,
    to: KeyringPair[],
    amount: number,
    nonce: BN
  ): Promise<void[]> {
    return Promise.all(
      to.map(async keyPair => {
        nonce = nonce.add(new BN(1));
        await this.transferBalance(from, keyPair.address, amount, nonce);
      })
    );
  }

  public getNonce(account: KeyringPair): Promise<BN> {
    return this.api.query.system.accountNonce(account.address).then(nonce => new BN(nonce.toString()));
  }

  private getBaseTxFee(): number {
    return this.api.createType('BalanceOf', this.api.consts.transactionPayment.transactionBaseFee).toNumber();
  }

  private estimateTxFee(tx: SubmittableExtrinsic<'promise'>): number {
    const baseFee: number = this.getBaseTxFee();
    const byteFee: number = this.api
      .createType('BalanceOf', this.api.consts.transactionPayment.transactionByteFee)
      .toNumber();
    return tx.toHex().length * byteFee + baseFee;
  }

  public estimateBuyMembershipFee(account: KeyringPair, paidTermsId: number, name: string): number {
    const nonce: BN = new BN(0);
    const signedTx = this.api.tx.members
      .buyMembership(paidTermsId, new UserInfo({ handle: name, avatar_uri: '', about: '' }))
      .sign(account, { nonce });
    return this.estimateTxFee(signedTx);
  }
}
