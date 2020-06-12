import React, { Children } from "react";
import { SerializedStyles } from "@emotion/core";
import { useCSS, HeaderStyleProps } from "./Header.style";

type HeaderProps = {
	text: string;
	subtext?: string;
	img?: string;
	cssTitle?: SerializedStyles;
	cssSubtitle?: SerializedStyles;
	children?: React.ReactNode;
} & HeaderStyleProps;

export default function Header({
	text,
	subtext = "",
	children,
	img,
	cssTitle,
	cssSubtitle,
	...styleProps
}: HeaderProps) {
	const styles = useCSS({ ...styleProps });
	return (
		<div css={styles.container}>
			<div css={styles.content}>
				<h1 css={[styles.title, cssTitle]}>{text}</h1>
				{subtext && <p css={[styles.subtitle, cssSubtitle]}>{subtext}</p>}
				{children}
			</div>
			<div css={styles.imgContainer}>
				<img src={img} css={styles.img} />
			</div>
		</div>
	);
}
