import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "rollup-plugin-babel";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import react from "react";
import reactDom from "react-dom";

import pkg from "./package.json";

export default {
  input: pkg.main,
  output: [
    {
      format: "cjs",
      file: "./dist/index.cjs.js",
    },
    {
      format: "es",
      file: "./dist/index.es.js",
    },
  ],
  plugins: [
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    }),
    commonjs({
      namedExports: {
        react: Object.keys(react),
        "react-dom": Object.keys(reactDom),
      },
    }),
    babel({
      runtimeHelpers: true,
      exclude: "../../node_modules/**",
      extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
    }),
  ],
};
