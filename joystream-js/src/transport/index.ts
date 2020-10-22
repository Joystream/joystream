import { ApiPromise } from '@polkadot/api'
import ChainTransport from './chain'
import ProposalsTransport from './proposals'
import MembersTransport from './members'
import CouncilTransport from './council'
import ValidatorsTransport from './validators'
import WorkingGroupsTransport from './workingGroups'
import { APIQueryCache } from './APIQueryCache'
import TokenomicsTransport from './tokenomics'
import { getAugmented, AugmentedApi } from './helpers/augmentedApi'

export default class Transport {
  protected api: ApiPromise
  protected augmentedApi: AugmentedApi
  protected cacheApi: APIQueryCache
  // Specific transports
  public chain: ChainTransport
  public members: MembersTransport
  public council: CouncilTransport
  public proposals: ProposalsTransport
  public validators: ValidatorsTransport
  public workingGroups: WorkingGroupsTransport
  public tokenomics: TokenomicsTransport

  constructor(api: ApiPromise) {
    this.api = api
    this.augmentedApi = getAugmented(api)
    this.cacheApi = new APIQueryCache(api)
    this.chain = new ChainTransport(api, this.cacheApi)
    this.members = new MembersTransport(api, this.cacheApi)
    this.validators = new ValidatorsTransport(api, this.cacheApi)
    this.council = new CouncilTransport(api, this.cacheApi, this.members, this.chain)
    this.proposals = new ProposalsTransport(api, this.cacheApi, this.members, this.chain, this.council)
    this.workingGroups = new WorkingGroupsTransport(api, this.cacheApi, this.members, this.chain)
    this.tokenomics = new TokenomicsTransport(api, this.cacheApi, this.council, this.workingGroups)
  }

  get query() {
    return this.augmentedApi.query
  }

  get tx() {
    return this.augmentedApi.tx
  }
}
