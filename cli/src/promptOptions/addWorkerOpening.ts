import { ApiParamsOptions, ApiParamOptions, HRTStruct } from '../Types'
import { OpeningType, WorkingGroupOpeningPolicyCommitment } from '@joystream/types/working-group'
import { SlashingTerms } from '@joystream/types/common'
import { Bytes } from '@polkadot/types'
import { schemaValidator } from '@joystream/types/hiring'
import { createMock } from '@joystream/types'

class OpeningPolicyCommitmentOptions implements ApiParamsOptions {
  [paramName: string]: ApiParamOptions
  public role_slashing_terms: ApiParamOptions<SlashingTerms> = {
    value: {
      default: createMock('SlashingTerms', { Unslashable: null }),
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
      default: createMock('OpeningType', { Worker: null }),
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
