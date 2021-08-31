import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@dzlzv/hydra-common";
import { Codec } from "@polkadot/types/types";
import { typeRegistry } from ".";

import {
  ApplicationIdSet,
  ApplicationIdToWorkerIdMap,
  OpeningId,
  RationaleText,
  RewardPolicy,
  WorkerId,
} from "@joystream/types/augment";
import { Bytes, Option, bool } from "@polkadot/types";

export namespace StorageWorkingGroup {
  /**
   *  Emits on updating the worker storage role.
   *  Params:
   *  - Id of the worker.
   *  - Raw storage field.
   *
   *  Event parameters: [WorkerId, Vec<u8>, ]
   */
  export class WorkerStorageUpdatedEvent {
    public readonly expectedParamTypes = ["WorkerId", "Vec<u8>"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): WorkerStorageUpdated_Params {
      return new WorkerStorageUpdated_Params(this.ctx);
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

  class WorkerStorageUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.ctx.params[0].value,
      ]);
    }

    get bytes(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.ctx.params[1].value,
      ]);
    }
  }
  /**
   *  Emits on filling the worker opening.
   *  Params:
   *  - Worker opening id
   *  - Worker application id to the worker id dictionary
   *
   *  Event parameters: [OpeningId, ApplicationIdToWorkerIdMap, ]
   */
  export class OpeningFilledEvent {
    public readonly expectedParamTypes = [
      "OpeningId",
      "ApplicationIdToWorkerIdMap",
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): OpeningFilled_Params {
      return new OpeningFilled_Params(this.ctx);
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

  class OpeningFilled_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get openingId(): OpeningId {
      return createTypeUnsafe<OpeningId & Codec>(typeRegistry, "OpeningId", [
        this.ctx.params[0].value,
      ]);
    }

    get applicationIdToWorkerIdMap(): ApplicationIdToWorkerIdMap {
      return createTypeUnsafe<ApplicationIdToWorkerIdMap & Codec>(
        typeRegistry,
        "ApplicationIdToWorkerIdMap",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits on terminating the worker.
   *  Params:
   *  - worker id.
   *  - termination rationale text
   *
   *  Event parameters: [WorkerId, RationaleText, ]
   */
  export class TerminatedWorkerEvent {
    public readonly expectedParamTypes = ["WorkerId", "RationaleText"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): TerminatedWorker_Params {
      return new TerminatedWorker_Params(this.ctx);
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

  class TerminatedWorker_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.ctx.params[0].value,
      ]);
    }

    get rationaleText(): RationaleText {
      return createTypeUnsafe<RationaleText & Codec>(
        typeRegistry,
        "RationaleText",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits on exiting the worker.
   *  Params:
   *  - worker id.
   *  - exit rationale text
   *
   *  Event parameters: [WorkerId, RationaleText, ]
   */
  export class WorkerExitedEvent {
    public readonly expectedParamTypes = ["WorkerId", "RationaleText"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): WorkerExited_Params {
      return new WorkerExited_Params(this.ctx);
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

  class WorkerExited_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.ctx.params[0].value,
      ]);
    }

    get rationaleText(): RationaleText {
      return createTypeUnsafe<RationaleText & Codec>(
        typeRegistry,
        "RationaleText",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits on terminating the leader.
   *  Params:
   *  - leader worker id.
   *  - termination rationale text
   *
   *  Event parameters: [WorkerId, RationaleText, ]
   */
  export class TerminatedLeaderEvent {
    public readonly expectedParamTypes = ["WorkerId", "RationaleText"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): TerminatedLeader_Params {
      return new TerminatedLeader_Params(this.ctx);
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

  class TerminatedLeader_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.ctx.params[0].value,
      ]);
    }

    get rationaleText(): RationaleText {
      return createTypeUnsafe<RationaleText & Codec>(
        typeRegistry,
        "RationaleText",
        [this.ctx.params[1].value]
      );
    }
  }

  /**
   *  Update the associated role storage.
   */
  export class UpdateRoleStorageCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["WorkerId", "Bytes"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateRoleStorage_Args {
      return new UpdateRoleStorage_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class UpdateRoleStorage_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.extrinsic.args[0].value,
      ]);
    }

    get storage(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value,
      ]);
    }
  }
  /**
   *  Fill opening for worker/lead.
   *  Require signed leader origin or the root (to fill opening for the leader position).
   */
  export class FillOpeningCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "OpeningId",
      "ApplicationIdSet",
      "Option<RewardPolicy>",
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): FillOpening_Args {
      return new FillOpening_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class FillOpening_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get openingId(): OpeningId {
      return createTypeUnsafe<OpeningId & Codec>(typeRegistry, "OpeningId", [
        this.extrinsic.args[0].value,
      ]);
    }

    get successfulApplicationIds(): ApplicationIdSet {
      return createTypeUnsafe<ApplicationIdSet & Codec>(
        typeRegistry,
        "ApplicationIdSet",
        [this.extrinsic.args[1].value]
      );
    }

    get rewardPolicy(): Option<RewardPolicy> {
      return createTypeUnsafe<Option<RewardPolicy> & Codec>(
        typeRegistry,
        "Option<RewardPolicy>",
        [this.extrinsic.args[2].value]
      );
    }
  }
  /**
   *  Leave the role by the active worker.
   */
  export class LeaveRoleCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["WorkerId", "Bytes"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): LeaveRole_Args {
      return new LeaveRole_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class LeaveRole_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.extrinsic.args[0].value,
      ]);
    }

    get rationaleText(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value,
      ]);
    }
  }
  /**
   *  Terminate the active worker by the lead.
   *  Require signed leader origin or the root (to terminate the leader role).
   */
  export class TerminateRoleCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["WorkerId", "Bytes", "bool"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): TerminateRole_Args {
      return new TerminateRole_Args(this.extrinsic);
    }

    validateArgs(): boolean {
      if (this.expectedArgTypes.length !== this.extrinsic.args.length) {
        return false;
      }
      let valid = true;
      this.expectedArgTypes.forEach((type, i) => {
        if (type !== this.extrinsic.args[i].type) {
          valid = false;
        }
      });
      return valid;
    }
  }

  class TerminateRole_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get workerId(): WorkerId {
      return createTypeUnsafe<WorkerId & Codec>(typeRegistry, "WorkerId", [
        this.extrinsic.args[0].value,
      ]);
    }

    get rationaleText(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[1].value,
      ]);
    }

    get slashStake(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.extrinsic.args[2].value,
      ]);
    }
  }
}
