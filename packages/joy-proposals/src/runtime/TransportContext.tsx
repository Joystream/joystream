import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiContext } from "@polkadot/react-api";
import { ApiProps } from "@polkadot/react-api/types";
import { SubstrateTransport } from "@polkadot/joy-media/transport.substrate";

const TransportContext = createContext(null);

export function MockProvider({ children }) {
  return <TransportContext.Provider value={new TransportMock()}>{children}</TransportContext.Provider>;
}

export function SubstrateProvider({ children }) {
  let api: ApiProps = useContext(ApiContext);
  let transport = new SubstrateTransport(api);

  return <TransportContext.Provider value={transport}>{children}</TransportContext.Provider>;
}
