import { Args, BaseTxInfo, defineMethod, OptionsWithMeta, UnsignedTransaction } from '@substrate/txwrapper-core'

export interface BalancesTransferKeepAliveArgs extends Args {
  /**
   * The recipient address, SS-58 encoded.
   */
  dest: string
  /**
   * The amount to send.
   */
  value: number | string
}

/**
 * Construct a balance transferKeepAlive transaction offline.
 *
 * @param args - Arguments specific to this method.
 * @param info - Information required to construct the transaction.
 * @param options - Registry and metadata used for constructing the method.
 */
export function transferKeepAlive(
  args: BalancesTransferKeepAliveArgs,
  info: BaseTxInfo,
  options: OptionsWithMeta
): UnsignedTransaction {
  return defineMethod(
    {
      method: {
        args,
        name: 'transferKeepAlive',
        pallet: 'balances',
      },
      ...info,
    },
    options
  )
}
