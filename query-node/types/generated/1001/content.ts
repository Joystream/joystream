/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { BTreeSet, Bytes, Option, bool, u128, u64 } from "@polkadot/types";
import {
  PalletContentChannelCreationParametersRecord,
  PalletContentChannelFundsDestination,
  PalletContentChannelRecord,
  PalletContentChannelUpdateParametersRecord,
  PalletContentIterableEnumsChannelActionPermission,
  PalletContentNftTypesEnglishAuctionParamsRecord,
  PalletContentNftTypesNftIssuanceParametersRecord,
  PalletContentNftTypesOpenAuctionParamsRecord,
  PalletContentPermissionsContentActor,
  PalletContentUpdateChannelPayoutsParametersRecord,
  PalletContentVideoCreationParametersRecord,
  PalletContentVideoUpdateParametersRecord,
} from "./types-lookup";
import { AccountId32 } from "@polkadot/types/interfaces";

export class Content_CuratorGroupCreatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64] {
    return [createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_CuratorGroupStatusSetEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, bool] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_CuratorAddedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    u64,
    u64,
    BTreeSet<PalletContentIterableEnumsChannelActionPermission>
  ] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "BTreeSet<PalletContentIterableEnumsChannelActionPermission>",
        [this.ctx.params[2].value]
      ),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_CuratorRemovedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelCreatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    u64,
    PalletContentChannelRecord,
    PalletContentChannelCreationParametersRecord,
    AccountId32
  ] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentChannelRecord", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentChannelCreationParametersRecord",
        [this.ctx.params[2].value]
      ),
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    PalletContentChannelUpdateParametersRecord,
    BTreeSet<u64>
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentChannelUpdateParametersRecord",
        [this.ctx.params[2].value]
      ),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelAssetsRemovedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    BTreeSet<u64>,
    PalletContentChannelRecord
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "PalletContentChannelRecord", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoCreatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    u64,
    PalletContentVideoCreationParametersRecord,
    BTreeSet<u64>
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentVideoCreationParametersRecord",
        [this.ctx.params[3].value]
      ),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[4].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    PalletContentVideoUpdateParametersRecord,
    BTreeSet<u64>
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentVideoUpdateParametersRecord",
        [this.ctx.params[2].value]
      ),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoDeletedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelDeletedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelDeletedByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoDeletedByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelAssetsDeletedByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    BTreeSet<u64>,
    Bytes
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoAssetsDeletedByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    BTreeSet<u64>,
    bool,
    Bytes
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "BTreeSet<u64>", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[3].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[4].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_VideoVisibilitySetByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, bool, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelVisibilitySetByModeratorEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, bool, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "bool", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

/**
 * Metaprotocols related event
 *
 *  Event parameters: []
 */
export class Content_ChannelOwnerRemarkedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelAgentRemarkedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, Bytes] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Bytes", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelPayoutsUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentUpdateChannelPayoutsParametersRecord,
    Option<u64>
  ] {
    return [
      createTypeUnsafe(
        typeRegistry,
        "PalletContentUpdateChannelPayoutsParametersRecord",
        [this.ctx.params[0].value]
      ),
      createTypeUnsafe(typeRegistry, "Option<u64>", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelRewardUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u128, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelFundsWithdrawnEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    u128,
    PalletContentChannelFundsDestination
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "PalletContentChannelFundsDestination", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_ChannelRewardClaimedAndWithdrawnEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    u128,
    PalletContentChannelFundsDestination
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "PalletContentChannelFundsDestination", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_OpenAuctionStartedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    PalletContentNftTypesOpenAuctionParamsRecord,
    u64
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentNftTypesOpenAuctionParamsRecord",
        [this.ctx.params[2].value]
      ),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_EnglishAuctionStartedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    PalletContentNftTypesEnglishAuctionParamsRecord
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentNftTypesEnglishAuctionParamsRecord",
        [this.ctx.params[2].value]
      ),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_NftIssuedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletContentPermissionsContentActor,
    u64,
    PalletContentNftTypesNftIssuanceParametersRecord
  ] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletContentNftTypesNftIssuanceParametersRecord",
        [this.ctx.params[2].value]
      ),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_AuctionBidMadeEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, u128, Option<u64>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Option<u64>", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_AuctionBidCanceledEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_AuctionCanceledEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_EnglishAuctionSettledEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, AccountId32, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "AccountId32", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_BidMadeCompletingAuctionEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64, Option<u64>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "Option<u64>", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_OpenAuctionBidAcceptedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [PalletContentPermissionsContentActor, u64, u64, u128] {
    return [
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[0].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_OfferStartedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor, u64, Option<u128>] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[2].value]),
      createTypeUnsafe(typeRegistry, "Option<u128>", [
        this.ctx.params[3].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_OfferAcceptedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64] {
    return [createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value])];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_OfferCanceledEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_NftSellOrderMadeEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor, u128] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_NftBoughtEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, u64] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[1].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_BuyNowCanceledEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_BuyNowPriceUpdatedEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor, u128] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[2].value]),
    ];
  }

  get specVersion(): number {
    return 1001;
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

export class Content_NftSlingedBackToTheOriginalArtistEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [u64, PalletContentPermissionsContentActor] {
    return [
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[0].value]),
      createTypeUnsafe(typeRegistry, "PalletContentPermissionsContentActor", [
        this.ctx.params[1].value,
      ]),
    ];
  }

  get specVersion(): number {
    return 1001;
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
