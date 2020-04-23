import React, { createContext, useContext } from "react";
import { ApiContext } from "@polkadot/react-api";
import { ApiProps } from "@polkadot/react-api/types";
import { SubstrateTransport } from "./transport.substrate";
import { MockTransport } from "./transport.mock";
import { Transport } from "./transport";

export const TransportContext = createContext<Transport>(new MockTransport());

export function MockProvider({ children }) {
  return <TransportContext.Provider value={new MockTransport()}>{children}</TransportContext.Provider>;
}

export function SubstrateProvider({ children }) {
  const api: ApiProps = useContext(ApiContext);
  const transport = new SubstrateTransport(api);

  return <TransportContext.Provider value={transport}>{children}</TransportContext.Provider>;
}

export function useTransport() {
  return useContext<SubstrateTransport>(TransportContext);
}
