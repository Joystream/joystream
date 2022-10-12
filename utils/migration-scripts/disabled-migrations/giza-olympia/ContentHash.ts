import { createHash, HashInput, NodeHash } from 'blake3'
import { HashReader } from 'blake3/dist/wasm/nodejs'
import { toB58String, encode } from 'multihashes'

// Based on distributor node's implementation
export class ContentHash {
  private hash: NodeHash<HashReader>
  public static readonly algorithm = 'blake3'

  constructor() {
    this.hash = createHash()
  }

  update(data: HashInput): this {
    this.hash.update(data)
    return this
  }

  digest(): string {
    return toB58String(encode(this.hash.digest(), ContentHash.algorithm))
  }
}
