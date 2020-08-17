import { ApiPromise } from '@polkadot/api';
import ChainTransport from './chain';
import ContentWorkingGroupTransport from './contentWorkingGroup';
import ProposalsTransport from './proposals';
import MembersTransport from './members';
import CouncilTransport from './council';
import ValidatorsTransport from './validators';
import WorkingGroupsTransport from './workingGroups';
import { APIQueryCache } from '../APIQueryCache';

export default class Transport {
  protected api: ApiPromise;
  protected cacheApi: APIQueryCache;
  // Specific transports
  public chain: ChainTransport;
  public members: MembersTransport;
  public council: CouncilTransport;
  public proposals: ProposalsTransport;
  public contentWorkingGroup: ContentWorkingGroupTransport;
  public validators: ValidatorsTransport;
  public workingGroups: WorkingGroupsTransport;

  constructor (api: ApiPromise) {
    this.api = api;
    this.cacheApi = new APIQueryCache(api);
    this.chain = new ChainTransport(api, this.cacheApi);
    this.members = new MembersTransport(api, this.cacheApi);
    this.validators = new ValidatorsTransport(api, this.cacheApi);
    this.council = new CouncilTransport(api, this.cacheApi, this.members, this.chain);
    this.contentWorkingGroup = new ContentWorkingGroupTransport(api, this.cacheApi, this.members);
    this.proposals = new ProposalsTransport(api, this.cacheApi, this.members, this.chain, this.council);
    this.workingGroups = new WorkingGroupsTransport(api, this.cacheApi, this.members);
  }
}
