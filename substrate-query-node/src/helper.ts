import * as _ from "lodash";
import { Event } from "@polkadot/types/interfaces";

import { BaseMemberEvent } from "./member";

export function getEventClassInstance<T extends BaseMemberEvent>(event: Event, type: { new (): T }): T {
  const { data, typeDef } = event;
  const instance = new type();

  let key: string;
  // loop through each of the parameters, get type and data
  data.map((data, index) => {
    key = _.camelCase(typeDef[index].type);
    if (data) {
      instance[key] = data;
    }
  });
  return instance;
}
