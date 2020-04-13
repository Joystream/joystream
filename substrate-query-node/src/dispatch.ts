import { Event } from "@polkadot/types/interfaces";

import { handleMemberRegistered } from "./mapping";
import { MEMBERREGISTERED } from "./eventNames";
import { MemberRegisteredEvent } from "./member";
import { getEventClassInstance } from "./helper";

export async function dispatch(event: Event) {
  const { method } = event;

  switch (method) {
    case MEMBERREGISTERED:
      const instance = getEventClassInstance<MemberRegisteredEvent>(event, MemberRegisteredEvent);
      handleMemberRegistered(instance);
      break;

    default:
      break;
  }
}
