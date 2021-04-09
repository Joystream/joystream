import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@dzlzv/hydra-common";
import { Codec } from "@polkadot/types/types";
import { typeRegistry } from ".";

import { Vec, bool } from "@polkadot/types";
import {
  ContentId,
  ContentParameters,
  ObjectOwner,
  StorageObjectOwner,
  StorageProviderId,
  UploadingStatus
} from "@joystream/types/augment";

export namespace DataDirectory {
  /**
   *  Emits on adding of the content.
   *  Params:
   *  - Content parameters representation.
   *  - StorageObjectOwner enum.
   *
   *  Event parameters: [Vec<ContentParameters>, StorageObjectOwner, ]
   */
  export class ContentAddedEvent {
    public readonly expectedParamTypes = [
      "Vec<ContentParameters>",
      "StorageObjectOwner"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ContentAdded_Params {
      return new ContentAdded_Params(this.ctx);
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

  class ContentAdded_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentParameters(): Vec<ContentParameters> {
      return createTypeUnsafe<Vec<ContentParameters> & Codec>(
        typeRegistry,
        "Vec<ContentParameters>",
        [this.ctx.params[0].value]
      );
    }

    get storageObjectOwner(): StorageObjectOwner {
      return createTypeUnsafe<StorageObjectOwner & Codec>(
        typeRegistry,
        "StorageObjectOwner",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits on content removal.
   *  Params:
   *  - Content parameters representation.
   *  - StorageObjectOwner enum.
   *
   *  Event parameters: [Vec<ContentId>, StorageObjectOwner, ]
   */
  export class ContentRemovedEvent {
    public readonly expectedParamTypes = [
      "Vec<ContentId>",
      "StorageObjectOwner"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ContentRemoved_Params {
      return new ContentRemoved_Params(this.ctx);
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

  class ContentRemoved_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentId(): Vec<ContentId> {
      return createTypeUnsafe<Vec<ContentId> & Codec>(
        typeRegistry,
        "Vec<ContentId>",
        [this.ctx.params[0].value]
      );
    }

    get storageObjectOwner(): StorageObjectOwner {
      return createTypeUnsafe<StorageObjectOwner & Codec>(
        typeRegistry,
        "StorageObjectOwner",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits when the storage provider accepts a content.
   *  Params:
   *  - Id of the relationship.
   *  - Id of the storage provider.
   *
   *  Event parameters: [ContentId, StorageProviderId, ]
   */
  export class ContentAcceptedEvent {
    public readonly expectedParamTypes = ["ContentId", "StorageProviderId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ContentAccepted_Params {
      return new ContentAccepted_Params(this.ctx);
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

  class ContentAccepted_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentId(): ContentId {
      return createTypeUnsafe<ContentId & Codec>(typeRegistry, "ContentId", [
        this.ctx.params[0].value
      ]);
    }

    get storageProviderId(): StorageProviderId {
      return createTypeUnsafe<StorageProviderId & Codec>(
        typeRegistry,
        "StorageProviderId",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits when the storage provider rejects a content.
   *  Params:
   *  - Id of the relationship.
   *  - Id of the storage provider.
   *
   *  Event parameters: [ContentId, StorageProviderId, ]
   */
  export class ContentRejectedEvent {
    public readonly expectedParamTypes = ["ContentId", "StorageProviderId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ContentRejected_Params {
      return new ContentRejected_Params(this.ctx);
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

  class ContentRejected_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentId(): ContentId {
      return createTypeUnsafe<ContentId & Codec>(typeRegistry, "ContentId", [
        this.ctx.params[0].value
      ]);
    }

    get storageProviderId(): StorageProviderId {
      return createTypeUnsafe<StorageProviderId & Codec>(
        typeRegistry,
        "StorageProviderId",
        [this.ctx.params[1].value]
      );
    }
  }
  /**
   *  Emits when the content uploading status update performed.
   *  Params:
   *  - UploadingStatus bool flag.
   *
   *  Event parameters: [UploadingStatus, ]
   */
  export class ContentUploadingStatusUpdatedEvent {
    public readonly expectedParamTypes = ["UploadingStatus"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ContentUploadingStatusUpdated_Params {
      return new ContentUploadingStatusUpdated_Params(this.ctx);
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

  class ContentUploadingStatusUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get uploadingStatus(): UploadingStatus {
      return createTypeUnsafe<UploadingStatus & Codec>(
        typeRegistry,
        "UploadingStatus",
        [this.ctx.params[0].value]
      );
    }
  }

  /**
   *  Adds the content to the system. The created DataObject
   *  awaits liaison to accept it.
   */
  export class AddContentCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ObjectOwner",
      "Vec<ContentParameters>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): AddContent_Args {
      return new AddContent_Args(this.extrinsic);
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

  class AddContent_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get owner(): ObjectOwner {
      return createTypeUnsafe<ObjectOwner & Codec>(
        typeRegistry,
        "ObjectOwner",
        [this.extrinsic.args[0].value]
      );
    }

    get content(): Vec<ContentParameters> {
      return createTypeUnsafe<Vec<ContentParameters> & Codec>(
        typeRegistry,
        "Vec<ContentParameters>",
        [this.extrinsic.args[1].value]
      );
    }
  }
  /**
   *  Remove the content from the system.
   */
  export class RemoveContentCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ObjectOwner", "Vec<ContentId>"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): RemoveContent_Args {
      return new RemoveContent_Args(this.extrinsic);
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

  class RemoveContent_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get owner(): ObjectOwner {
      return createTypeUnsafe<ObjectOwner & Codec>(
        typeRegistry,
        "ObjectOwner",
        [this.extrinsic.args[0].value]
      );
    }

    get contentIds(): Vec<ContentId> {
      return createTypeUnsafe<Vec<ContentId> & Codec>(
        typeRegistry,
        "Vec<ContentId>",
        [this.extrinsic.args[1].value]
      );
    }
  }
  /**
   *  Storage provider accepts a content. Requires signed storage provider account and its id.
   *  The LiaisonJudgement can only be updated once from Pending to Accepted.
   *  Subsequent calls are a no-op.
   */
  export class AcceptContentCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["StorageProviderId", "ContentId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): AcceptContent_Args {
      return new AcceptContent_Args(this.extrinsic);
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

  class AcceptContent_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get storageProviderId(): StorageProviderId {
      return createTypeUnsafe<StorageProviderId & Codec>(
        typeRegistry,
        "StorageProviderId",
        [this.extrinsic.args[0].value]
      );
    }

    get contentId(): ContentId {
      return createTypeUnsafe<ContentId & Codec>(typeRegistry, "ContentId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Locks / unlocks content uploading
   */
  export class UpdateContentUploadingStatusCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["bool"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateContentUploadingStatus_Args {
      return new UpdateContentUploadingStatus_Args(this.extrinsic);
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

  class UpdateContentUploadingStatus_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get isBlocked(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.extrinsic.args[0].value
      ]);
    }
  }
}
