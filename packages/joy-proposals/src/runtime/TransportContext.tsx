import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiContext } from "@polkadot/react-api";
import { ApiProps } from "@polkadot/react-api/types";
import { SubstrateTransport } from "./transport.substrate";
import { MockTransport } from "./transport.mock";
import { Transport } from "./transport";

const TransportContext = createContext<Transport>((null as unknown) as Transport);

export function MockProvider({ children }: { children: React.PropsWithChildren<{}> }) {
  return <TransportContext.Provider value={new MockTransport()}>{children}</TransportContext.Provider>;
}

export function SubstrateProvider({ children }: { children: React.PropsWithChildren<{}> }) {
  const api: ApiProps = useContext(ApiContext);
  const transport = new SubstrateTransport(api);

  return <TransportContext.Provider value={transport}>{children}</TransportContext.Provider>;
}

export function useTransport() {
  return useContext(TransportContext) as SubstrateTransport;
}
