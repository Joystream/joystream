import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@dzlzv/hydra-common";
import { Codec } from "@polkadot/types/types";
import { typeRegistry } from ".";

import {
  Actor,
  EntityId,
  FailedAt,
  SchemaId,
  SideEffects
} from "@joystream/types/augment/all/types";

export namespace ContentDirectory {
  export class EntityCreatedEvent {
    public readonly expectedParamTypes = ["Actor", "EntityId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): EntityCreated_Params {
      return new EntityCreated_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class EntityCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }

    get entityId(): EntityId {
      return createTypeUnsafe<EntityId & Codec>(typeRegistry, "EntityId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class EntityRemovedEvent {
    public readonly expectedParamTypes = ["Actor", "EntityId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): EntityRemoved_Params {
      return new EntityRemoved_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class EntityRemoved_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }

    get entityId(): EntityId {
      return createTypeUnsafe<EntityId & Codec>(typeRegistry, "EntityId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class EntitySchemaSupportAddedEvent {
    public readonly expectedParamTypes = [
      "Actor",
      "EntityId",
      "SchemaId",
      "SideEffects"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): EntitySchemaSupportAdded_Params {
      return new EntitySchemaSupportAdded_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class EntitySchemaSupportAdded_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }

    get entityId(): EntityId {
      return createTypeUnsafe<EntityId & Codec>(typeRegistry, "EntityId", [
        this.ctx.params[1].value
      ]);
    }

    get schemaId(): SchemaId {
      return createTypeUnsafe<SchemaId & Codec>(typeRegistry, "SchemaId", [
        this.ctx.params[2].value
      ]);
    }

    get sideEffects(): SideEffects {
      return createTypeUnsafe<SideEffects & Codec>(
        typeRegistry,
        "SideEffects",
        [this.ctx.params[3].value]
      );
    }
  }
  export class EntityPropertyValuesUpdatedEvent {
    public readonly expectedParamTypes = ["Actor", "EntityId", "SideEffects"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): EntityPropertyValuesUpdated_Params {
      return new EntityPropertyValuesUpdated_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class EntityPropertyValuesUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }

    get entityId(): EntityId {
      return createTypeUnsafe<EntityId & Codec>(typeRegistry, "EntityId", [
        this.ctx.params[1].value
      ]);
    }

    get sideEffects(): SideEffects {
      return createTypeUnsafe<SideEffects & Codec>(
        typeRegistry,
        "SideEffects",
        [this.ctx.params[2].value]
      );
    }
  }
  export class TransactionCompletedEvent {
    public readonly expectedParamTypes = ["Actor"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): TransactionCompleted_Params {
      return new TransactionCompleted_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class TransactionCompleted_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }
  }
  export class TransactionFailedEvent {
    public readonly expectedParamTypes = ["Actor", "FailedAt"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): TransactionFailed_Params {
      return new TransactionFailed_Params(this.ctx);
    }

    validateParams(): boolean {
      if (this.expectedParamTypes.length !== this.ctx.params.length) {
        return false;
      }
      let valid = true;
      this.expectedParamTypes.forEach((type, i) => {
        if (type !== this.ctx.params[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class TransactionFailed_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get actor(): Actor {
      return createTypeUnsafe<Actor & Codec>(typeRegistry, "Actor", [
        this.ctx.params[0].value
      ]);
    }

    get failedAt(): FailedAt {
      return createTypeUnsafe<FailedAt & Codec>(typeRegistry, "FailedAt", [
        this.ctx.params[1].value
      ]);
    }
  }
}
