import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import babel from "@rollup/plugin-babel";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import svgr from "@svgr/rollup";
import { DEFAULT_EXTENSIONS } from "@babel/core";

import pkg from "./package.json";

export default {
	input: "src/index.ts",
	output: [
		{
			file: pkg.main,
			format: "cjs",
			file: pkg.main,
		},
		{
			format: "esm",
			file: pkg.module,
		},
	],
	plugins: [
		peerDepsExternal(),
		svgr(),
		resolve({
			extensions: [".js", ".jsx", ".ts", ".tsx"],
			preferBuiltins: true,
		}),
		commonjs(),
		typescript({
			useTsconfigDeclarationDir: true,
		}),
		babel({
			babelHelpers: "runtime",
			exclude: /node_modules/,
			extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
			rootMode: "upward",
		}),
	],
};
