/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import {
  PalletCommonBalanceKind,
  PalletCommonWorkingGroupIterableEnumsWorkingGroup,
} from "./types-lookup";
import { u128 } from "@polkadot/types";

/**
 * An `Update Working Group Budget` proposal was executed
 * Params:
 * - Working group which budget is being updated
 * - Amount of balance being moved
 * - Enum variant with positive indicating funds moved torwards working group and negative
 * and negative funds moving from the working group
 *
 *  Event parameters: []
 */
export class JoystreamUtility_UpdatedWorkingGroupBudgetEvent_V1001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    PalletCommonWorkingGroupIterableEnumsWorkingGroup,
    u128,
    PalletCommonBalanceKind
  ] {
    return [
      createTypeUnsafe(
        typeRegistry,
        "PalletCommonWorkingGroupIterableEnumsWorkingGroup",
        [this.ctx.params[0].value]
      ),
      createTypeUnsafe(typeRegistry, "u128", [this.ctx.params[1].value]),
      createTypeUnsafe(typeRegistry, "PalletCommonBalanceKind", [
        this.ctx.params[2].value,
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
