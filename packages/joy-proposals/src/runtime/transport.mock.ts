import { Transport } from "./transport";
import { Proposal } from "@joystream/types/proposals";

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class MockTransport extends Transport {
  constructor() {
    super();
  }

  async proposals() {
    await delay(Math.random() * 2000);
    return Promise.all((Array.from({ length: 5 }, (_, i) => `Not implemented`) as unknown) as Proposal[]);
  }
}
