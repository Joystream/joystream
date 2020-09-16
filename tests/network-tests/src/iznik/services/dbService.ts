import lowdb from 'lowdb/lib/main'
import FileSync from 'lowdb/adapters/FileSync'
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types'
import Keyring from '@polkadot/keyring'
import BN from 'bn.js'

export class DbService {
  private static instance: DbService

  private adapter: any
  private db: any
  private keyring: Keyring
  private dbPath: string

  private static MEMBERS_KEY = 'members'
  private static COUNCIL_KEY = 'council'
  private static LEADER_KEY = 'leader'
  private static NONCE_KEY = 'nonce'

  private constructor() {
    this.keyring = new Keyring({ type: 'sr25519' })
    this.dbPath = process.env.DB_PATH!
    this.adapter = new FileSync(this.dbPath)
    this.db = lowdb(this.adapter)
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService()
    }
    return DbService.instance
  }

  public setCouncil(council: KeyringPair[]): void {
    council.forEach((keyPair, index) => {
      this.db.set(`${DbService.COUNCIL_KEY}.${index}`, keyPair.toJson()).write()
    })
  }

  public getCouncil(): KeyringPair[] {
    const council: KeyringPair[] = []
    const jsonKeyringPairs: KeyringPair$Json[] = this.db.get(DbService.COUNCIL_KEY).value()
    jsonKeyringPairs.forEach((jsonKeyringPair) => {
      const keyPair: KeyringPair = this.keyring.addFromJson(jsonKeyringPair)
      keyPair.decodePkcs8()
      council.push(keyPair)
    })
    return council
  }

  public hasCouncil(): boolean {
    return this.db.has(DbService.COUNCIL_KEY).value()
  }

  public setMembers(members: KeyringPair[]): void {
    members.forEach((keyPair, index) => {
      this.db.set(`${DbService.MEMBERS_KEY}.${index}`, keyPair.toJson()).write()
    })
  }

  public getMembers(): KeyringPair[] {
    const members: KeyringPair[] = []
    const jsonKeyringPairs: KeyringPair$Json[] = this.db.get(DbService.MEMBERS_KEY).value()
    jsonKeyringPairs.forEach((jsonKeyringPair) => {
      const keyPair: KeyringPair = this.keyring.addFromJson(jsonKeyringPair)
      keyPair.decodePkcs8()
      members.push(keyPair)
    })
    return members
  }

  public hasMembers(): boolean {
    return this.db.has(DbService.MEMBERS_KEY).value()
  }

  public setLeader(leader: KeyringPair, workingGroup: string): void {
    this.db.set(`${workingGroup}.${DbService.LEADER_KEY}`, leader.toJson()).write()
  }

  public getLeader(workingGroup: string): KeyringPair {
    const jsonKeyringPair: KeyringPair$Json = this.db.get(`${workingGroup}.${DbService.LEADER_KEY}`).value()
    const keyPair: KeyringPair = this.keyring.addFromJson(jsonKeyringPair)
    keyPair.decodePkcs8()
    return keyPair
  }

  public hasLeader(workingGroup: string): boolean {
    return this.db.has(`${workingGroup}.${DbService.LEADER_KEY}`).value()
  }

  public setNonce(address: string, nonce: BN): void {
    this.db.set(`${DbService.NONCE_KEY}.${address}`, nonce.toString()).write()
  }

  public getNonce(address: string): BN {
    return new BN(this.db.get(`${DbService.NONCE_KEY}.${address}`).value() as string)
  }

  public hasNonce(address: string): boolean {
    return this.db.has(`${DbService.NONCE_KEY}.${address}`).value()
  }

  public removeNonce(address: string): void {
    this.db.unset(`${DbService.NONCE_KEY}.${address}`).write()
  }
}
