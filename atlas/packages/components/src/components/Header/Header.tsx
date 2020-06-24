import React from "react";
import { SerializedStyles } from "@emotion/core";
import { useCSS, HeaderStyleProps } from "./Header.style";

type HeaderProps = {
	title: string;
	subtitle: string;
	backgroundImg: string;
	containerCss: SerializedStyles;
	children: React.ReactNode;
} & HeaderStyleProps;

export default function Header({ title, subtitle, children, backgroundImg, containerCss }: Partial<HeaderProps>) {
	const styles = useCSS({ backgroundImg });
	return (
		<section css={[styles.container, containerCss]}>
			<div css={styles.content}>
				<h1 css={styles.title}>{title}</h1>
				{subtitle && <p css={styles.subtitle}>{subtitle}</p>}
				{children}
			</div>
		</section>
	);
}
