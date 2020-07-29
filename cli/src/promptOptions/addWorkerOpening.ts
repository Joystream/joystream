import { ApiParamsOptions, ApiParamOptions, HRTStruct } from '../Types'
import {
  OpeningType,
  SlashingTerms,
  UnslashableTerms,
  OpeningType_Worker as OpeningTypeWorker,
  WorkingGroupOpeningPolicyCommitment,
} from '@joystream/types/working-group'
import { Bytes } from '@polkadot/types'
import { schemaValidator } from '@joystream/types/hiring'

class OpeningPolicyCommitmentOptions implements ApiParamsOptions {
  [paramName: string]: ApiParamOptions
  public role_slashing_terms: ApiParamOptions<SlashingTerms> = {
    value: {
      default: SlashingTerms.create('Unslashable', new UnslashableTerms()),
      locked: true,
    },
  }
  // Rename fields containing "curator" (solivg minor UI issue related to flat namespace)
  public terminate_curator_application_stake_unstaking_period: ApiParamOptions = {
    forcedName: 'terminate_application_stake_unstaking_period',
  }
  public terminate_curator_role_stake_unstaking_period: ApiParamOptions = {
    forcedName: 'terminate_role_stake_unstaking_period',
  }
  public exit_curator_role_application_stake_unstaking_period: ApiParamOptions = {
    forcedName: 'exit_role_application_stake_unstaking_period',
  }
  public exit_curator_role_stake_unstaking_period: ApiParamOptions = {
    forcedName: 'exit_role_stake_unstaking_period',
  }
}

class AddWrokerOpeningOptions implements ApiParamsOptions {
  [paramName: string]: ApiParamOptions
  // Lock value for opening_type
  public opening_type: ApiParamOptions<OpeningType> = {
    value: {
      default: OpeningType.create('Worker', new OpeningTypeWorker()),
      locked: true,
    },
  }
  // Json schema for human_readable_text
  public human_readable_text: ApiParamOptions<Bytes> = {
    jsonSchema: {
      schemaValidator,
      struct: HRTStruct,
    },
  }
  // Lock value for role_slashing_terms
  public commitment: ApiParamOptions<WorkingGroupOpeningPolicyCommitment> = {
    nestedOptions: new OpeningPolicyCommitmentOptions(),
  }
}

export default AddWrokerOpeningOptions
