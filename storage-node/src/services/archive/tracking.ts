import path from 'path'
import { createReadStream, promises as fsp } from 'fs'
import lockfile from 'proper-lockfile'
import readline from 'node:readline/promises'
import _ from 'lodash'

export const OBJECTS_TRACKING_FILENAME = 'objects_trackfile'
export const ARCHIVES_TRACKING_FILENAME = 'archives_trackfile.jsonl'

abstract class TrackfileService {
  protected abstract trackfilePath: string

  protected async acquireLock(): Promise<() => Promise<void>> {
    return lockfile.lock(this.trackfilePath, {
      // Retry timeout formula is:
      // Math.min(minTimeout * Math.pow(factor, attempt), maxTimeout)
      // Source: https://www.npmjs.com/package/retry
      retries: {
        minTimeout: 10,
        maxTimeout: 10,
        retries: 10_000,
      },
    })
  }

  protected async withLock<T>(func: () => Promise<T>): Promise<T> {
    const release = await this.acquireLock()
    const result = await func()
    await release()
    return result
  }

  protected abstract load(): Promise<void>
  public async init(): Promise<void> {
    // Create tracking file if it doesn't exist
    const fp = await fsp.open(this.trackfilePath, 'a')
    await fp.close()
    await this.load()
  }
}

type TrackedArchive = { name: string; dataObjectIds: string[] }

type ArchiveSearchResultHit = {
  name: string
  foundObjects: string[]
}
type ArchiveSearchResults = {
  hits: ArchiveSearchResultHit[]
  missingObjects: string[]
}

export class ArchivesTrackingService extends TrackfileService {
  protected trackfilePath: string
  protected trackedArchiveNames: Set<string> | undefined

  constructor(private directory: string, trackFileName = ARCHIVES_TRACKING_FILENAME) {
    super()
    this.trackfilePath = path.join(this.directory, trackFileName)
  }

  public getTrackfilePath(): string {
    return this.trackfilePath
  }

  public getTrackedArchiveNames(): Set<string> {
    if (!this.trackedArchiveNames) {
      throw new Error('Tracked archives not initialized!')
    }
    return this.trackedArchiveNames
  }

  public isTracked(archiveName: string): boolean {
    return this.getTrackedArchiveNames().has(archiveName)
  }

  public async track(archive: TrackedArchive): Promise<void> {
    if (this.isTracked(archive.name)) {
      return
    }
    await this.withLock(async () => {
      await fsp.appendFile(this.trackfilePath, JSON.stringify(archive) + '\n')
      this.getTrackedArchiveNames().add(archive.name)
    })
  }

  public async load(): Promise<void> {
    await this.withLock(async () => {
      const rl = readline.createInterface({ input: createReadStream(this.trackfilePath) })
      const trackedArchiveNames = new Set<string>()
      for await (const line of rl) {
        const trackedArchive: TrackedArchive = JSON.parse(line.trim())
        trackedArchiveNames.add(trackedArchive.name)
      }
      rl.close()
      this.trackedArchiveNames = trackedArchiveNames
    })
  }

  public async findDataObjects(dataObjectIds: string[]): Promise<ArchiveSearchResults> {
    const results: ArchiveSearchResults = {
      hits: [],
      missingObjects: [...dataObjectIds],
    }
    await this.withLock(async () => {
      const rl = readline.createInterface({ input: createReadStream(this.trackfilePath) })
      for await (const line of rl) {
        const trackedArchive: TrackedArchive = JSON.parse(line.trim())
        const foundObjects = _.intersection(trackedArchive.dataObjectIds, dataObjectIds)
        results.missingObjects = _.difference(results.missingObjects, foundObjects)
        if (foundObjects.length > 0) {
          results.hits.push({ name: trackedArchive.name, foundObjects })
        }
      }
      rl.close()
    })
    return results
  }
}

export class ObjectTrackingService extends TrackfileService {
  protected trackfilePath: string
  protected trackedObjects: Set<string> | undefined

  constructor(private directory: string) {
    super()
    this.trackfilePath = path.join(this.directory, OBJECTS_TRACKING_FILENAME)
  }

  public getTrackedObjects(): Set<string> {
    if (!this.trackedObjects) {
      throw new Error('Tracked objects not initialized!')
    }
    return this.trackedObjects
  }

  public isTracked(objectId: string): boolean {
    return this.getTrackedObjects().has(objectId)
  }

  public async track(dataObjectId: string): Promise<void> {
    if (this.isTracked(dataObjectId)) {
      return
    }
    await this.withLock(async () => {
      await fsp.appendFile(this.trackfilePath, `${dataObjectId}\n`)
      this.getTrackedObjects().add(dataObjectId)
    })
  }

  public async untrack(dataObjectId: string): Promise<void> {
    await this.withLock(async () => {
      await fsp.appendFile(this.trackfilePath, `${dataObjectId} D\n`)
      this.getTrackedObjects().delete(dataObjectId)
    })
  }

  protected async load(): Promise<void> {
    await this.loadTrackedObjects()
    const trackedObjects = this.getTrackedObjects()

    // Perform defragmentation of the trackfile
    await this.withLock(async () => {
      await fsp.rename(this.trackfilePath, `${this.trackfilePath}.old`)

      const fp = await fsp.open(this.trackfilePath, 'w')
      for (const dataObjectId of trackedObjects) {
        await fp.write(`${dataObjectId}\n`)
      }
      await fp.close()
      await fsp.unlink(`${this.trackfilePath}.old`)
    })
  }

  protected async loadTrackedObjects(): Promise<void> {
    await this.withLock(async () => {
      const rl = readline.createInterface({ input: createReadStream(this.trackfilePath) })
      const trackedObjects = new Set<string>()
      for await (const line of rl) {
        const [dataObjectId, isDeleted] = line.split(' ')
        if (isDeleted) {
          trackedObjects.delete(dataObjectId)
        } else {
          trackedObjects.add(dataObjectId)
        }
      }
      rl.close()
      this.trackedObjects = trackedObjects
    })
  }
}
