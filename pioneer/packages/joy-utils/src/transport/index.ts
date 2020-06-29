import { ApiPromise } from '@polkadot/api';
import ChainTransport from './chain';
import ContentWorkingGroupTransport from './contentWorkingGroup';
import ProposalsTransport from './proposals';
import MembersTransport from './members';
import CouncilTransport from './council';
import StorageProvidersTransport from './storageProviders';
import ValidatorsTransport from './validators';

export default class Transport {
  protected api: ApiPromise;
  // Specific transports
  public chain: ChainTransport;
  public members: MembersTransport;
  public council: CouncilTransport;
  public proposals: ProposalsTransport;
  public contentWorkingGroup: ContentWorkingGroupTransport;
  public storageProviders: StorageProvidersTransport;
  public validators: ValidatorsTransport;

  constructor (api: ApiPromise) {
    this.api = api;
    this.chain = new ChainTransport(api);
    this.members = new MembersTransport(api);
    this.storageProviders = new StorageProvidersTransport(api);
    this.validators = new ValidatorsTransport(api);
    this.council = new CouncilTransport(api, this.members, this.chain);
    this.contentWorkingGroup = new ContentWorkingGroupTransport(api, this.members);
    this.proposals = new ProposalsTransport(api, this.members, this.chain, this.council);
  }
}
