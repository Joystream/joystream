import React from "react";
import { SerializedStyles } from "@emotion/core";
import { useCSS } from "./Gallery.style";
import Button from "../Button";
import Carousel from "../Carousel";

type GalleryProps = {
	title: string;
	action: string;
	onClick: () => void;
	children: React.ReactNode[];
	containerCss: SerializedStyles;
	leftControlCss: SerializedStyles;
	rightControlCss: SerializedStyles;
};

const Gallery: React.FC<Partial<GalleryProps>> = ({
	title,
	onClick,
	action = "",
	children,
	containerCss,
	leftControlCss,
	rightControlCss,
}) => {
	const styles = useCSS();
	return (
		<section css={[styles.container, containerCss]}>
			<div css={styles.headingContainer}>
				{title && <h4>{title}</h4>}
				{action && (
					<Button type="tertiary" onClick={onClick}>
						{action}
					</Button>
				)}
			</div>
			<Carousel leftControlCss={leftControlCss} rightControlCss={rightControlCss}>
				{children}
			</Carousel>
		</section>
	);
};

export default Gallery;
