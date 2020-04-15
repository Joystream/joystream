import BN from 'bn.js';
import ExitCodes from '../ExitCodes';
import { decodeAddress } from '@polkadot/util-crypto';
import { AccountBalances } from '../Types';
import { CLIError } from '@oclif/errors';

export function validateAddress(address: string, errorMessage: string = 'Invalid address'): void {
    try {
        decodeAddress(address);
    } catch (e) {
        throw new CLIError(errorMessage, { exit: ExitCodes.InvalidInput });
    }
}

export function checkBalance(accBalances: AccountBalances, requiredBalance: BN): void {
    if (requiredBalance.gt(accBalances.free)) {
        throw new CLIError('Not enough balance available', { exit: ExitCodes.InvalidInput });
    }
}
