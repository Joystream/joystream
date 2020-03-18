import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "rollup-plugin-babel";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import react from "react";
import reactDom from "react-dom";

import pkg from "./package.json";

export default {
  input: "./src/index.js",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
    },
  ],
  plugins: [
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      preferBuiltins: true,
    }),
    babel({
      exclude: "../../node_modules",
      extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
    }),
    commonjs({
      exclude: "../../node_modules",
      namedExports: {
        react: Object.keys(react),
        "react-dom": Object.keys(reactDom),
      },
    }),
  ],
};
