import { assert } from 'chai'
import { Utils } from './utils'
import { extendDebug } from './Debugger'

const debug = extendDebug('resources')

type NamedLocks = Record<Resource, Lock>
export type ResourceLocker = (resource: Resource, timeout?: number) => Promise<() => void>

class Lock {
  private name: string

  // the number of concurrent locks that can be acquired concurrently before the resource
  // becomes unavailable until a lock is released.
  private readonly concurrency: number
  private lockCount = 0

  constructor(key: string, concurrency?: number) {
    this.name = key
    this.concurrency = concurrency || 1
  }

  public async lock(timeoutMinutes = 2): Promise<() => void> {
    const timeoutAt = Date.now() + timeoutMinutes * 60 * 1000

    while (this.lockCount === this.concurrency) {
      debug(`waiting for ${this.name}`)
      await Utils.wait(30000)
      if (Date.now() > timeoutAt) throw new Error(`Timeout getting resource lock: ${this.name}`)
    }

    debug(`acquired ${this.name}`)
    this.lockCount++

    // Return a function used to release the lock
    return (() => {
      let called = false
      return () => {
        if (called) return
        called = true
        debug(`released ${this.name}`)
        this.lockCount--
      }
    })()
  }
}

export enum Resource {
  Council = 'Council',
  Proposals = 'Proposals',
}

export class ResourceManager {
  // Internal Map
  private resources = new Map<string, Lock>()

  private readonly locks: NamedLocks

  constructor() {
    this.locks = this.createNamedLocks()
  }

  private add(key: string, concurrency?: number): Lock {
    assert(!this.resources.has(key))
    this.resources.set(key, new Lock(key, concurrency))
    return this.resources.get(key) as Lock
  }

  private createNamedLocks(): NamedLocks {
    return {
      [Resource.Council]: this.add(Resource.Council),
      // We assume that a flow will only have one active proposal at a time
      // Runtime is configured for MaxActiveProposalLimit = 5
      // So we should ensure we don't exceed that number of active proposals
      // which limits the number of concurrent tests that create proposals
      [Resource.Proposals]: this.add(Resource.Proposals, 5),
    }
  }

  public createLocker(): { release: () => void; lock: ResourceLocker } {
    const unlockers: Array<() => void> = []
    const release = () => {
      unlockers.forEach((unlock) => unlock())
    }
    return {
      release,
      lock: async (resource: Resource, timeout?: number) => {
        const unlock = await this.locks[resource].lock(timeout)
        unlockers.push(unlock)
        return unlock
      },
    }
  }
}
