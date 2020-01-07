import { Enum, Struct } from '@polkadot/types/codec'
import { getTypeRegistry, Text, u32 } from '@polkadot/types'
import { GenericJoyStreamRoleSchema } from './schemas/role.schema'
import ajv from 'ajv'

class BlockNumber extends u32 {}

const schemaValidator = new ajv({allErrors: true}).compile(require('./schemas/role.schema.json'))

export class Opening extends Struct {
  constructor (value?: any) {
    super({
      created: BlockNumber,
      max_review_period_length: BlockNumber,
      stage: OpeningStage,
      // missing fields. See https://github.com/bedeho/substrate-hiring-module/blob/initial_work/src/hiring.rs#L264
      human_readable_text: Text,
    }, value);
  }

  get human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
      const hrt = this.get('human_readable_text')

      if (typeof hrt === "undefined") {
          return undefined
      }

      const str = hrt.toString()

      try {
      const obj = JSON.parse(str)
      if (schemaValidator(obj) === true) {
          return obj as unknown as GenericJoyStreamRoleSchema
      }
      } catch(e) {
          console.log("JSON schema validation failed:", e.toString())
      }

      return str
  }

  get stage(): OpeningStage {
    return this.get('stage') as OpeningStage
  }

  get max_review_period_length(): BlockNumber {
      return this.get('max_review_period_length') as BlockNumber
  }
}

export class AcceptingApplications extends Struct {
  constructor (value?: any) {
    super({
        started_accepting_applicants_at_block: BlockNumber
    }, value);
  }
}

export class ReviewPeriod extends Struct {
  constructor (value?: any) {
    super({
       started_accepting_applicants_at_block: BlockNumber,
       started_review_period_at_block: BlockNumber,
    }, value);
  }
}

export class OpeningDeactivationCause extends Enum {
  constructor (value?: any) {
    super([
        "CancelledBeforeActivation",
        "CancelledAcceptingApplications",
        "CancelledInReviewPeriod",
        "ReviewPeriodExpired",
        "Filled",
    ], value);
  }
}

export class Deactivated extends Struct {
  constructor (value?: any) {
    super({
        cause: OpeningDeactivationCause,
        deactivated_at_block: BlockNumber,
        started_accepting_applicants_at_block: BlockNumber,
        started_review_period_at_block: BlockNumber,
    }, value);
  }
}

export class ActiveOpeningStage extends Enum {
  constructor (value?: any) {
    super({
        AcceptingApplications,
        ReviewPeriod,
        Deactivated,
    }, value);
  }
}

export class OpeningStageWaitingToBegin extends Struct {
  constructor (value?: any) {
    super({
        begins_at_block: BlockNumber,
    }, value);
  }
}

export class OpeningStageActive extends Struct {
  constructor (value?: any) {
    super({
        stage: ActiveOpeningStage,
        // FIXME! Missing fields
    }, value);
  }
}

export class OpeningStage extends Enum {
  constructor (value?: any) {
    super({
        OpeningStageWaitingToBegin,
        OpeningStageActive,
    }, value);
  }
}

export function registerHiringTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      AcceptingApplications,
      ReviewPeriod,
      OpeningDeactivationCause,
      Deactivated,
      ActiveOpeningStage,
      Opening,
    });
  } catch (err) {
    console.error('Failed to register custom types of roles module', err);
  }
}
