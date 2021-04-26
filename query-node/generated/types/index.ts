import { TypeRegistry } from "@polkadot/types";
import path from "path";
import fs from "fs";
const typeRegistry = new TypeRegistry();

typeRegistry.register(
  JSON.parse(fs.readFileSync(path.join(__dirname, "typedefs.json"), "utf-8"))
);

export { typeRegistry };

export * from "./members";
export * from "./content";
export * from "./data-directory";
