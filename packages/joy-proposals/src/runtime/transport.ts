import { Proposal } from "@joystream/types/proposals";

export abstract class Transport {
  abstract proposals(): Promise<Proposal[]>;
}
