import * as CSS from "csstype";

type StyleObj = { [k in keyof CSS.Properties]: number | string };
export type StyleFn = (style: StyleObj, x: any) => StyleObj;

// TODO: Properly type this
type StyleMonad = (
	run: StyleFn
) => {
	run: StyleFn;
	map: (f: (args: any) => any) => StyleMonad;
	contramap: (f: (args: any) => any) => StyleMonad;
	concat: (other: StyleMonad) => StyleMonad;
};

export const Reducer = (run: StyleFn) => ({
	run,
	concat: (other: any) => Reducer((styles: StyleObj, props: any) => other.run(run(styles, props), props)),
	map: (f: (x: any) => any) => Reducer((styles: StyleObj, props: any) => f(run(styles, props))),
	contramap: (f: (x: any) => any) => Reducer((styles: StyleObj, props: any) => run(styles, f(props))),
});
