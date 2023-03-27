/* eslint-disable */

import { TypeRegistry, Metadata } from "@polkadot/types";
import metadataHex from "./metadata.json";

const typeRegistry = new TypeRegistry() as any;
const metadata = new Metadata(typeRegistry, metadataHex as `0x${string}`);

typeRegistry.setMetadata(metadata);

export { typeRegistry };
