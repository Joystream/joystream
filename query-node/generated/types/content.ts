import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@dzlzv/hydra-common";
import { Codec } from "@polkadot/types/types";
import { typeRegistry } from ".";

import {
  Channel,
  ChannelCategory,
  ChannelCategoryCreationParameters,
  ChannelCategoryId,
  ChannelCategoryUpdateParameters,
  ChannelCreationParameters,
  ChannelId,
  ChannelOwnershipTransferRequest,
  ChannelOwnershipTransferRequestId,
  ChannelUpdateParameters,
  ContentActor,
  ContentId,
  CuratorGroupId,
  CuratorId,
  PlaylistCreationParameters,
  PlaylistId,
  PlaylistUpdateParameters,
  VideoCategoryCreationParameters,
  VideoCategoryId,
  VideoCategoryUpdateParameters,
  VideoCreationParameters,
  VideoId,
  VideoUpdateParameters
} from "@joystream/types/augment";
import { Bytes, Vec, bool } from "@polkadot/types";

export namespace Content {
  export class CuratorGroupCreatedEvent {
    public readonly expectedParamTypes = ["CuratorGroupId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): CuratorGroupCreated_Params {
      return new CuratorGroupCreated_Params(this.ctx);
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

  class CuratorGroupCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.ctx.params[0].value]
      );
    }
  }
  export class CuratorGroupStatusSetEvent {
    public readonly expectedParamTypes = ["CuratorGroupId", "bool"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): CuratorGroupStatusSet_Params {
      return new CuratorGroupStatusSet_Params(this.ctx);
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

  class CuratorGroupStatusSet_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.ctx.params[0].value]
      );
    }

    get bool(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class CuratorAddedEvent {
    public readonly expectedParamTypes = ["CuratorGroupId", "CuratorId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): CuratorAdded_Params {
      return new CuratorAdded_Params(this.ctx);
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

  class CuratorAdded_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.ctx.params[0].value]
      );
    }

    get curatorId(): CuratorId {
      return createTypeUnsafe<CuratorId & Codec>(typeRegistry, "CuratorId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class CuratorRemovedEvent {
    public readonly expectedParamTypes = ["CuratorGroupId", "CuratorId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): CuratorRemoved_Params {
      return new CuratorRemoved_Params(this.ctx);
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

  class CuratorRemoved_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.ctx.params[0].value]
      );
    }

    get curatorId(): CuratorId {
      return createTypeUnsafe<CuratorId & Codec>(typeRegistry, "CuratorId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class ChannelCreatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelId",
      "Channel",
      "ChannelCreationParameters<ContentParameters, AccountId>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelCreated_Params {
      return new ChannelCreated_Params(this.ctx);
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

  class ChannelCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.ctx.params[1].value
      ]);
    }

    get channel(): Channel {
      return createTypeUnsafe<Channel & Codec>(typeRegistry, "Channel", [
        this.ctx.params[2].value
      ]);
    }

    get channelCreationParameters(): ChannelCreationParameters {
      return createTypeUnsafe<ChannelCreationParameters & Codec>(
        typeRegistry,
        "ChannelCreationParameters",
        [this.ctx.params[3].value]
      );
    }
  }
  export class ChannelUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelId",
      "Channel",
      "ChannelUpdateParameters<ContentParameters, AccountId>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelUpdated_Params {
      return new ChannelUpdated_Params(this.ctx);
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

  class ChannelUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.ctx.params[1].value
      ]);
    }

    get channel(): Channel {
      return createTypeUnsafe<Channel & Codec>(typeRegistry, "Channel", [
        this.ctx.params[2].value
      ]);
    }

    get channelUpdateParameters(): ChannelUpdateParameters {
      return createTypeUnsafe<ChannelUpdateParameters & Codec>(
        typeRegistry,
        "ChannelUpdateParameters",
        [this.ctx.params[3].value]
      );
    }
  }
  export class ChannelAssetsRemovedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelId",
      "Vec<ContentId>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelAssetsRemoved_Params {
      return new ChannelAssetsRemoved_Params(this.ctx);
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

  class ChannelAssetsRemoved_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.ctx.params[1].value
      ]);
    }

    get contentId(): Vec<ContentId> {
      return createTypeUnsafe<Vec<ContentId> & Codec>(
        typeRegistry,
        "Vec<ContentId>",
        [this.ctx.params[2].value]
      );
    }
  }
  export class ChannelCensorshipStatusUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelId",
      "bool",
      "Vec<u8>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelCensorshipStatusUpdated_Params {
      return new ChannelCensorshipStatusUpdated_Params(this.ctx);
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

  class ChannelCensorshipStatusUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.ctx.params[1].value
      ]);
    }

    get bool(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.ctx.params[2].value
      ]);
    }

    get bytes(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.ctx.params[3].value
      ]);
    }
  }
  export class ChannelOwnershipTransferRequestedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelOwnershipTransferRequestId",
      "ChannelOwnershipTransferRequest"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelOwnershipTransferRequested_Params {
      return new ChannelOwnershipTransferRequested_Params(this.ctx);
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

  class ChannelOwnershipTransferRequested_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelOwnershipTransferRequestId(): ChannelOwnershipTransferRequestId {
      return createTypeUnsafe<ChannelOwnershipTransferRequestId & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequestId",
        [this.ctx.params[1].value]
      );
    }

    get channelOwnershipTransferRequest(): ChannelOwnershipTransferRequest {
      return createTypeUnsafe<ChannelOwnershipTransferRequest & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequest",
        [this.ctx.params[2].value]
      );
    }
  }
  export class ChannelOwnershipTransferRequestWithdrawnEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelOwnershipTransferRequestId"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelOwnershipTransferRequestWithdrawn_Params {
      return new ChannelOwnershipTransferRequestWithdrawn_Params(this.ctx);
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

  class ChannelOwnershipTransferRequestWithdrawn_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelOwnershipTransferRequestId(): ChannelOwnershipTransferRequestId {
      return createTypeUnsafe<ChannelOwnershipTransferRequestId & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequestId",
        [this.ctx.params[1].value]
      );
    }
  }
  export class ChannelOwnershipTransferredEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelOwnershipTransferRequestId"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelOwnershipTransferred_Params {
      return new ChannelOwnershipTransferred_Params(this.ctx);
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

  class ChannelOwnershipTransferred_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelOwnershipTransferRequestId(): ChannelOwnershipTransferRequestId {
      return createTypeUnsafe<ChannelOwnershipTransferRequestId & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequestId",
        [this.ctx.params[1].value]
      );
    }
  }
  export class ChannelCategoryCreatedEvent {
    public readonly expectedParamTypes = [
      "ChannelCategoryId",
      "ChannelCategory",
      "ChannelCategoryCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelCategoryCreated_Params {
      return new ChannelCategoryCreated_Params(this.ctx);
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

  class ChannelCategoryCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get channelCategoryId(): ChannelCategoryId {
      return createTypeUnsafe<ChannelCategoryId & Codec>(
        typeRegistry,
        "ChannelCategoryId",
        [this.ctx.params[0].value]
      );
    }

    get channelCategory(): ChannelCategory {
      return createTypeUnsafe<ChannelCategory & Codec>(
        typeRegistry,
        "ChannelCategory",
        [this.ctx.params[1].value]
      );
    }

    get channelCategoryCreationParameters(): ChannelCategoryCreationParameters {
      return createTypeUnsafe<ChannelCategoryCreationParameters & Codec>(
        typeRegistry,
        "ChannelCategoryCreationParameters",
        [this.ctx.params[2].value]
      );
    }
  }
  export class ChannelCategoryUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelCategoryId",
      "ChannelCategoryUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelCategoryUpdated_Params {
      return new ChannelCategoryUpdated_Params(this.ctx);
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

  class ChannelCategoryUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelCategoryId(): ChannelCategoryId {
      return createTypeUnsafe<ChannelCategoryId & Codec>(
        typeRegistry,
        "ChannelCategoryId",
        [this.ctx.params[1].value]
      );
    }

    get channelCategoryUpdateParameters(): ChannelCategoryUpdateParameters {
      return createTypeUnsafe<ChannelCategoryUpdateParameters & Codec>(
        typeRegistry,
        "ChannelCategoryUpdateParameters",
        [this.ctx.params[2].value]
      );
    }
  }
  export class ChannelCategoryDeletedEvent {
    public readonly expectedParamTypes = ["ContentActor", "ChannelCategoryId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): ChannelCategoryDeleted_Params {
      return new ChannelCategoryDeleted_Params(this.ctx);
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

  class ChannelCategoryDeleted_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelCategoryId(): ChannelCategoryId {
      return createTypeUnsafe<ChannelCategoryId & Codec>(
        typeRegistry,
        "ChannelCategoryId",
        [this.ctx.params[1].value]
      );
    }
  }
  export class VideoCategoryCreatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "VideoCategoryId",
      "VideoCategoryCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoCategoryCreated_Params {
      return new VideoCategoryCreated_Params(this.ctx);
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

  class VideoCategoryCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoCategoryId(): VideoCategoryId {
      return createTypeUnsafe<VideoCategoryId & Codec>(
        typeRegistry,
        "VideoCategoryId",
        [this.ctx.params[1].value]
      );
    }

    get videoCategoryCreationParameters(): VideoCategoryCreationParameters {
      return createTypeUnsafe<VideoCategoryCreationParameters & Codec>(
        typeRegistry,
        "VideoCategoryCreationParameters",
        [this.ctx.params[2].value]
      );
    }
  }
  export class VideoCategoryUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "VideoCategoryId",
      "VideoCategoryUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoCategoryUpdated_Params {
      return new VideoCategoryUpdated_Params(this.ctx);
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

  class VideoCategoryUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoCategoryId(): VideoCategoryId {
      return createTypeUnsafe<VideoCategoryId & Codec>(
        typeRegistry,
        "VideoCategoryId",
        [this.ctx.params[1].value]
      );
    }

    get videoCategoryUpdateParameters(): VideoCategoryUpdateParameters {
      return createTypeUnsafe<VideoCategoryUpdateParameters & Codec>(
        typeRegistry,
        "VideoCategoryUpdateParameters",
        [this.ctx.params[2].value]
      );
    }
  }
  export class VideoCategoryDeletedEvent {
    public readonly expectedParamTypes = ["ContentActor", "VideoCategoryId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoCategoryDeleted_Params {
      return new VideoCategoryDeleted_Params(this.ctx);
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

  class VideoCategoryDeleted_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoCategoryId(): VideoCategoryId {
      return createTypeUnsafe<VideoCategoryId & Codec>(
        typeRegistry,
        "VideoCategoryId",
        [this.ctx.params[1].value]
      );
    }
  }
  export class VideoCreatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "ChannelId",
      "VideoId",
      "VideoCreationParameters<ContentParameters>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoCreated_Params {
      return new VideoCreated_Params(this.ctx);
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

  class VideoCreated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.ctx.params[1].value
      ]);
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.ctx.params[2].value
      ]);
    }

    get videoCreationParameters(): VideoCreationParameters {
      return createTypeUnsafe<VideoCreationParameters & Codec>(
        typeRegistry,
        "VideoCreationParameters",
        [this.ctx.params[3].value]
      );
    }
  }
  export class VideoUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "VideoId",
      "VideoUpdateParameters<ContentParameters>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoUpdated_Params {
      return new VideoUpdated_Params(this.ctx);
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

  class VideoUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.ctx.params[1].value
      ]);
    }

    get videoUpdateParameters(): VideoUpdateParameters {
      return createTypeUnsafe<VideoUpdateParameters & Codec>(
        typeRegistry,
        "VideoUpdateParameters",
        [this.ctx.params[2].value]
      );
    }
  }
  export class VideoDeletedEvent {
    public readonly expectedParamTypes = ["ContentActor", "VideoId"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoDeleted_Params {
      return new VideoDeleted_Params(this.ctx);
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

  class VideoDeleted_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.ctx.params[1].value
      ]);
    }
  }
  export class VideoCensorshipStatusUpdatedEvent {
    public readonly expectedParamTypes = [
      "ContentActor",
      "VideoId",
      "bool",
      "Vec<u8>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): VideoCensorshipStatusUpdated_Params {
      return new VideoCensorshipStatusUpdated_Params(this.ctx);
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

  class VideoCensorshipStatusUpdated_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.ctx.params[1].value
      ]);
    }

    get bool(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.ctx.params[2].value
      ]);
    }

    get bytes(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.ctx.params[3].value
      ]);
    }
  }
  export class FeaturedVideosSetEvent {
    public readonly expectedParamTypes = ["ContentActor", "Vec<VideoId>"];

    constructor(public readonly ctx: SubstrateEvent) {}

    get data(): FeaturedVideosSet_Params {
      return new FeaturedVideosSet_Params(this.ctx);
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

  class FeaturedVideosSet_Params {
    constructor(public readonly ctx: SubstrateEvent) {}

    get contentActor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.ctx.params[0].value]
      );
    }

    get videoId(): Vec<VideoId> {
      return createTypeUnsafe<Vec<VideoId> & Codec>(
        typeRegistry,
        "Vec<VideoId>",
        [this.ctx.params[1].value]
      );
    }
  }

  /**
   *  Add new curator group to runtime storage
   */
  export class CreateCuratorGroupCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreateCuratorGroup_Args {
      return new CreateCuratorGroup_Args(this.extrinsic);
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

  class CreateCuratorGroup_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}
  }
  /**
   *  Set `is_active` status for curator group under given `curator_group_id`
   */
  export class SetCuratorGroupStatusCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["CuratorGroupId", "bool"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): SetCuratorGroupStatus_Args {
      return new SetCuratorGroupStatus_Args(this.extrinsic);
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

  class SetCuratorGroupStatus_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.extrinsic.args[0].value]
      );
    }

    get isActive(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Add curator to curator group under given `curator_group_id`
   */
  export class AddCuratorToGroupCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["CuratorGroupId", "CuratorId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): AddCuratorToGroup_Args {
      return new AddCuratorToGroup_Args(this.extrinsic);
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

  class AddCuratorToGroup_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.extrinsic.args[0].value]
      );
    }

    get curatorId(): CuratorId {
      return createTypeUnsafe<CuratorId & Codec>(typeRegistry, "CuratorId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  /**
   *  Remove curator from a given curator group
   */
  export class RemoveCuratorFromGroupCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["CuratorGroupId", "CuratorId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): RemoveCuratorFromGroup_Args {
      return new RemoveCuratorFromGroup_Args(this.extrinsic);
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

  class RemoveCuratorFromGroup_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get curatorGroupId(): CuratorGroupId {
      return createTypeUnsafe<CuratorGroupId & Codec>(
        typeRegistry,
        "CuratorGroupId",
        [this.extrinsic.args[0].value]
      );
    }

    get curatorId(): CuratorId {
      return createTypeUnsafe<CuratorId & Codec>(typeRegistry, "CuratorId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  export class CreateChannelCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreateChannel_Args {
      return new CreateChannel_Args(this.extrinsic);
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

  class CreateChannel_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get params(): ChannelCreationParameters {
      return createTypeUnsafe<ChannelCreationParameters & Codec>(
        typeRegistry,
        "ChannelCreationParameters",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class UpdateChannelCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "ChannelUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateChannel_Args {
      return new UpdateChannel_Args(this.extrinsic);
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

  class UpdateChannel_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get params(): ChannelUpdateParameters {
      return createTypeUnsafe<ChannelUpdateParameters & Codec>(
        typeRegistry,
        "ChannelUpdateParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  /**
   *  Remove assets of a channel from storage
   */
  export class RemoveChannelAssetsCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "Vec<ContentId>"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): RemoveChannelAssets_Args {
      return new RemoveChannelAssets_Args(this.extrinsic);
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

  class RemoveChannelAssets_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get assets(): Vec<ContentId> {
      return createTypeUnsafe<Vec<ContentId> & Codec>(
        typeRegistry,
        "Vec<ContentId>",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class UpdateChannelCensorshipStatusCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "bool",
      "Bytes"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateChannelCensorshipStatus_Args {
      return new UpdateChannelCensorshipStatus_Args(this.extrinsic);
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

  class UpdateChannelCensorshipStatus_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get isCensored(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.extrinsic.args[2].value
      ]);
    }

    get rationale(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[3].value
      ]);
    }
  }
  export class CreateChannelCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelCategoryCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreateChannelCategory_Args {
      return new CreateChannelCategory_Args(this.extrinsic);
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

  class CreateChannelCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get params(): ChannelCategoryCreationParameters {
      return createTypeUnsafe<ChannelCategoryCreationParameters & Codec>(
        typeRegistry,
        "ChannelCategoryCreationParameters",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class UpdateChannelCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelCategoryId",
      "ChannelCategoryUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateChannelCategory_Args {
      return new UpdateChannelCategory_Args(this.extrinsic);
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

  class UpdateChannelCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get categoryId(): ChannelCategoryId {
      return createTypeUnsafe<ChannelCategoryId & Codec>(
        typeRegistry,
        "ChannelCategoryId",
        [this.extrinsic.args[1].value]
      );
    }

    get params(): ChannelCategoryUpdateParameters {
      return createTypeUnsafe<ChannelCategoryUpdateParameters & Codec>(
        typeRegistry,
        "ChannelCategoryUpdateParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class DeleteChannelCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ContentActor", "ChannelCategoryId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): DeleteChannelCategory_Args {
      return new DeleteChannelCategory_Args(this.extrinsic);
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

  class DeleteChannelCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get categoryId(): ChannelCategoryId {
      return createTypeUnsafe<ChannelCategoryId & Codec>(
        typeRegistry,
        "ChannelCategoryId",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class RequestChannelTransferCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelOwnershipTransferRequest"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): RequestChannelTransfer_Args {
      return new RequestChannelTransfer_Args(this.extrinsic);
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

  class RequestChannelTransfer_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get request(): ChannelOwnershipTransferRequest {
      return createTypeUnsafe<ChannelOwnershipTransferRequest & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequest",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class CancelChannelTransferRequestCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ChannelOwnershipTransferRequestId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CancelChannelTransferRequest_Args {
      return new CancelChannelTransferRequest_Args(this.extrinsic);
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

  class CancelChannelTransferRequest_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get requestId(): ChannelOwnershipTransferRequestId {
      return createTypeUnsafe<ChannelOwnershipTransferRequestId & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequestId",
        [this.extrinsic.args[0].value]
      );
    }
  }
  export class AcceptChannelTransferCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelOwnershipTransferRequestId"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): AcceptChannelTransfer_Args {
      return new AcceptChannelTransfer_Args(this.extrinsic);
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

  class AcceptChannelTransfer_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get requestId(): ChannelOwnershipTransferRequestId {
      return createTypeUnsafe<ChannelOwnershipTransferRequestId & Codec>(
        typeRegistry,
        "ChannelOwnershipTransferRequestId",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class CreateVideoCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "VideoCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreateVideo_Args {
      return new CreateVideo_Args(this.extrinsic);
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

  class CreateVideo_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get params(): VideoCreationParameters {
      return createTypeUnsafe<VideoCreationParameters & Codec>(
        typeRegistry,
        "VideoCreationParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class UpdateVideoCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "VideoId",
      "VideoUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateVideo_Args {
      return new UpdateVideo_Args(this.extrinsic);
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

  class UpdateVideo_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.extrinsic.args[1].value
      ]);
    }

    get params(): VideoUpdateParameters {
      return createTypeUnsafe<VideoUpdateParameters & Codec>(
        typeRegistry,
        "VideoUpdateParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class DeleteVideoCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ContentActor", "VideoId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): DeleteVideo_Args {
      return new DeleteVideo_Args(this.extrinsic);
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

  class DeleteVideo_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  export class CreatePlaylistCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "PlaylistCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreatePlaylist_Args {
      return new CreatePlaylist_Args(this.extrinsic);
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

  class CreatePlaylist_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get params(): PlaylistCreationParameters {
      return createTypeUnsafe<PlaylistCreationParameters & Codec>(
        typeRegistry,
        "PlaylistCreationParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class UpdatePlaylistCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "PlaylistId",
      "PlaylistUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdatePlaylist_Args {
      return new UpdatePlaylist_Args(this.extrinsic);
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

  class UpdatePlaylist_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get playlist(): PlaylistId {
      return createTypeUnsafe<PlaylistId & Codec>(typeRegistry, "PlaylistId", [
        this.extrinsic.args[1].value
      ]);
    }

    get params(): PlaylistUpdateParameters {
      return createTypeUnsafe<PlaylistUpdateParameters & Codec>(
        typeRegistry,
        "PlaylistUpdateParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class DeletePlaylistCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "ChannelId",
      "PlaylistId"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): DeletePlaylist_Args {
      return new DeletePlaylist_Args(this.extrinsic);
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

  class DeletePlaylist_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get channelId(): ChannelId {
      return createTypeUnsafe<ChannelId & Codec>(typeRegistry, "ChannelId", [
        this.extrinsic.args[1].value
      ]);
    }

    get playlist(): PlaylistId {
      return createTypeUnsafe<PlaylistId & Codec>(typeRegistry, "PlaylistId", [
        this.extrinsic.args[2].value
      ]);
    }
  }
  export class SetFeaturedVideosCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ContentActor", "Vec<VideoId>"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): SetFeaturedVideos_Args {
      return new SetFeaturedVideos_Args(this.extrinsic);
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

  class SetFeaturedVideos_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get list(): Vec<VideoId> {
      return createTypeUnsafe<Vec<VideoId> & Codec>(
        typeRegistry,
        "Vec<VideoId>",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class CreateVideoCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "VideoCategoryCreationParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): CreateVideoCategory_Args {
      return new CreateVideoCategory_Args(this.extrinsic);
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

  class CreateVideoCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get params(): VideoCategoryCreationParameters {
      return createTypeUnsafe<VideoCategoryCreationParameters & Codec>(
        typeRegistry,
        "VideoCategoryCreationParameters",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class UpdateVideoCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "VideoCategoryId",
      "VideoCategoryUpdateParameters"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateVideoCategory_Args {
      return new UpdateVideoCategory_Args(this.extrinsic);
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

  class UpdateVideoCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get categoryId(): VideoCategoryId {
      return createTypeUnsafe<VideoCategoryId & Codec>(
        typeRegistry,
        "VideoCategoryId",
        [this.extrinsic.args[1].value]
      );
    }

    get params(): VideoCategoryUpdateParameters {
      return createTypeUnsafe<VideoCategoryUpdateParameters & Codec>(
        typeRegistry,
        "VideoCategoryUpdateParameters",
        [this.extrinsic.args[2].value]
      );
    }
  }
  export class DeleteVideoCategoryCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ContentActor", "VideoCategoryId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): DeleteVideoCategory_Args {
      return new DeleteVideoCategory_Args(this.extrinsic);
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

  class DeleteVideoCategory_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get categoryId(): VideoCategoryId {
      return createTypeUnsafe<VideoCategoryId & Codec>(
        typeRegistry,
        "VideoCategoryId",
        [this.extrinsic.args[1].value]
      );
    }
  }
  export class RemovePersonFromVideoCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = ["ContentActor", "VideoId"];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): RemovePersonFromVideo_Args {
      return new RemovePersonFromVideo_Args(this.extrinsic);
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

  class RemovePersonFromVideo_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.extrinsic.args[1].value
      ]);
    }
  }
  export class UpdateVideoCensorshipStatusCall {
    public readonly extrinsic: SubstrateExtrinsic;
    public readonly expectedArgTypes = [
      "ContentActor",
      "VideoId",
      "bool",
      "Bytes"
    ];

    constructor(public readonly ctx: SubstrateEvent) {
      if (ctx.extrinsic === undefined) {
        throw new Error(`No call data has been provided`);
      }
      this.extrinsic = ctx.extrinsic;
    }

    get args(): UpdateVideoCensorshipStatus_Args {
      return new UpdateVideoCensorshipStatus_Args(this.extrinsic);
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

  class UpdateVideoCensorshipStatus_Args {
    constructor(public readonly extrinsic: SubstrateExtrinsic) {}

    get actor(): ContentActor {
      return createTypeUnsafe<ContentActor & Codec>(
        typeRegistry,
        "ContentActor",
        [this.extrinsic.args[0].value]
      );
    }

    get videoId(): VideoId {
      return createTypeUnsafe<VideoId & Codec>(typeRegistry, "VideoId", [
        this.extrinsic.args[1].value
      ]);
    }

    get isCensored(): bool {
      return createTypeUnsafe<bool & Codec>(typeRegistry, "bool", [
        this.extrinsic.args[2].value
      ]);
    }

    get rationale(): Bytes {
      return createTypeUnsafe<Bytes & Codec>(typeRegistry, "Bytes", [
        this.extrinsic.args[3].value
      ]);
    }
  }
}
