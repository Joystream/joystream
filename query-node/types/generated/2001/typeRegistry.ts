/* eslint-disable */

import { TypeRegistry, Metadata } from "@polkadot/types";
import metadataObject from "./metadata.json";

const typeRegistry = new TypeRegistry() as any;
const metadata = new Metadata(
  typeRegistry,
  metadataObject.result as `0x${string}`
);

typeRegistry.setMetadata(metadata);

export { typeRegistry };
