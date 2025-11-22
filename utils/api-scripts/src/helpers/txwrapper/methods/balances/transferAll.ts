import { Args, BaseTxInfo, defineMethod, OptionsWithMeta, UnsignedTransaction } from '@substrate/txwrapper-core'

export interface BalancesTransferAllArgs extends Args {
  /**
   * The recipient address, SS-58 encoded.
   */
  dest: string
  /**
   * The amount to send.
   */
  keepAlive: boolean
}

/**
 * Construct a balance transferAll transaction offline.
 *
 * @param args - Arguments specific to this method.
 * @param info - Information required to construct the transaction.
 * @param options - Registry and metadata used for constructing the method.
 */
export function transferAll(
  args: BalancesTransferAllArgs,
  info: BaseTxInfo,
  options: OptionsWithMeta
): UnsignedTransaction {
  return defineMethod(
    {
      method: {
        args,
        name: 'transferAll',
        pallet: 'balances',
      },
      ...info,
    },
    options
  )
}
