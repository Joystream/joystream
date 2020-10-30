export interface IBlockProducer<T> {
  /**
   * Fetches a block at the given height. Throws an error if the
   * requested height is greater than the current chain height
   *
   * @param height Height to fetch a block at.
   * @returns block data as specified by the generic type
   */
  fetchBlock(height: number): Promise<T>

  /**
   *  Async generator to fetch finalized block heights from the underlying
   *  substrate chain. If it already at the tip of the chain, waits until the
   *  next block is finalized.
   */
  blockHeights(): AsyncGenerator<number>

  /**
   *
   * @param height Height from which the block production will start
   */
  start(height: number): Promise<void>

  /**
   *  Stops producing the block
   */
  stop(): Promise<void>
}
