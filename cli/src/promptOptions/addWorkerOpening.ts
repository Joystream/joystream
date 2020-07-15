import { ApiParamsOptions, ApiParamOptions, HRTStruct } from '../Types';
import { OpeningType, SlashingTerms, UnslashableTerms, OpeningType_Worker } from '@joystream/types/working-group';
import { Bytes } from '@polkadot/types';
import { schemaValidator } from '@joystream/types/hiring';
import { WorkingGroupOpeningPolicyCommitment } from '@joystream/types/working-group';

class OpeningPolicyCommitmentOptions implements ApiParamsOptions {
    [paramName: string]: ApiParamOptions;
    public role_slashing_terms: ApiParamOptions<SlashingTerms> = {
        value: {
            default: SlashingTerms.create('Unslashable', new UnslashableTerms()),
            locked: true
        }
    }
}

class AddWrokerOpeningOptions implements ApiParamsOptions {
    [paramName: string]: ApiParamOptions;
    // Lock value for opening_type
    public opening_type: ApiParamOptions<OpeningType> = {
        value: {
            default: OpeningType.create('Worker', new OpeningType_Worker()),
            locked: true
        }
    };
    // Json schema for human_readable_text
    public human_readable_text: ApiParamOptions<Bytes> = {
        jsonSchema: {
            schemaValidator,
            struct: HRTStruct
        }
    }
    // Lock value for role_slashing_terms
    public commitment: ApiParamOptions<WorkingGroupOpeningPolicyCommitment> = {
        nestedOptions: new OpeningPolicyCommitmentOptions()
    }
};

export default AddWrokerOpeningOptions;
