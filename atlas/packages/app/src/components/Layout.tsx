import React from "react";
import { GlobalStyle } from "@joystream/components";

type LayoutProps = { children: React.ReactNode };

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<GlobalStyle />
			{children}
		</>
	);
}
