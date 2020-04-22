import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiContext } from "@polkadot/react-api";
import { ApiProps } from "@polkadot/react-api/types";
import { SubstrateTransport } from "./transport.substrate";
import { MockTransport } from "./transport.mock";
import { Transport } from "./transport";

const TransportContext = createContext<Transport | null>(null);

export function MockProvider({ children }: { children: React.ReactChildren }) {
  return <TransportContext.Provider value={new MockTransport()}>{children}</TransportContext.Provider>;
}

export function SubstrateProvider({ children }: { children: React.ReactChildren }) {
  let api: ApiProps = useContext(ApiContext);
  let transport = new SubstrateTransport(api);

  return <TransportContext.Provider value={transport}>{children}</TransportContext.Provider>;
}

export function useTransport() {
  return useContext(TransportContext);
}
