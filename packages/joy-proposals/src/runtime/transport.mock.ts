import Transport from "./transport";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class MockTransport extends Transport {
  constructor() {
    super();
  }

  async allProposals() {
    await delay(Math.random() * 2000);
    return;
  }
}
