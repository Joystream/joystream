import { assert } from 'chai'
import { Utils } from './utils'
import Debugger from 'debug'

const debug = Debugger('resources')

export type Resources = Record<ResourceName, Resource>
export type ResourceLocker = (resource: ResourceName, timeout?: number) => Promise<() => void>

export class Resource {
  private name: string

  // the number of concurrent locks that can be acquired concurrently before the resource
  // becomes unavailable until a lock is released.
  private readonly concurrency: number
  private lockCount = 0

  constructor(key: string, concurrency?: number) {
    this.name = key
    this.concurrency = concurrency || 1
  }

  public async lock(timeoutMinutes = 1): Promise<() => void> {
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

export enum ResourceName {
  Council = 'Council',
  Proposals = 'Proposals',
}

export class ResourceManager {
  // Internal Map
  private resources = new Map<string, Resource>()

  private readonly locks: Resources

  constructor() {
    this.locks = this.createNamedResources()
  }

  private add(key: string, concurrency?: number): Resource {
    assert(!this.resources.has(key))
    this.resources.set(key, new Resource(key, concurrency))
    return this.resources.get(key) as Resource
  }

  private createNamedResources(): Resources {
    return {
      [ResourceName.Council]: this.add(ResourceName.Council),
      [ResourceName.Proposals]: this.add(ResourceName.Proposals, 5),
    }
  }

  public createLocker(): { release: () => void; lock: ResourceLocker } {
    const unlockers: Array<() => void> = []
    const release = () => {
      unlockers.forEach((unlock) => unlock())
    }
    return {
      release,
      lock: async (resource: ResourceName, timeout?: number) => {
        const unlock = await this.locks[resource].lock(timeout)
        unlockers.push(unlock)
        return unlock
      },
    }
  }
}
