import React, { ReactNode } from "react";

type TabProps = {
	label: string;
	children: ReactNode;
};

//FIXME: Actually add markup for the tab
export default function Tab({ label, children }: TabProps) {
	// let styles = makeStyles(styleProps)

	return <div>{children}</div>;
}
