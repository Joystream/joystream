/* eslint-disable */

import { createTypeUnsafe } from "@polkadot/types/create";
import { SubstrateEvent, SubstrateExtrinsic } from "@joystream/hydra-common";
import { typeRegistry } from "./typeRegistry";

import { u32, u64 } from "@polkadot/types";
import {
  PalletProposalsCodexGeneralProposalParams,
  PalletProposalsCodexProposalDetails,
} from "./types-lookup";

/**
 * A proposal was created
 * Params:
 * - Id of a newly created proposal after it was saved in storage.
 * - General proposal parameter. Parameters shared by all proposals
 * - Proposal Details. Parameter of proposal with a variant for each kind of proposal
 * - Id of a newly created proposal thread
 *
 *  Event parameters: []
 */
export class ProposalsCodex_ProposalCreatedEvent_V2001 {
  public readonly expectedParamTypes = [];

  constructor(public readonly ctx: SubstrateEvent) {}

  get params(): [
    u32,
    PalletProposalsCodexGeneralProposalParams,
    PalletProposalsCodexProposalDetails,
    u64
  ] {
    return [
      createTypeUnsafe(typeRegistry, "u32", [this.ctx.params[0].value]),
      createTypeUnsafe(
        typeRegistry,
        "PalletProposalsCodexGeneralProposalParams",
        [this.ctx.params[1].value]
      ),
      createTypeUnsafe(typeRegistry, "PalletProposalsCodexProposalDetails", [
        this.ctx.params[2].value,
      ]),
      createTypeUnsafe(typeRegistry, "u64", [this.ctx.params[3].value]),
    ];
  }

  get specVersion(): number {
    return 2001;
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
