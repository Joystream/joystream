import React, { useState, useRef } from "react";
import { animated, useTrail, useSpring } from "react-spring";
import { useCSS, CarouselStyleProps } from "./Carousel.style";
import NavButton from "../NavButton";

type CarouselProps = {
	children: React.ReactNode;
	scrollAmount?: number;
	maxInView?: number;
} & CarouselStyleProps;

export default function Carousel({ children, scrollAmount = 200, maxInView = 4, ...styleProps }: CarouselProps) {
	let styles = useCSS(styleProps);
	const container = useRef<HTMLDivElement>(null);

	function onScroll(direction: "right" | "left") {
		if (container.current != null) {
			container.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	}
	return (
		<div css={styles.wrapper}>
			<div css={styles.container} ref={container}>
				{children}
			</div>
			<div css={styles.navLeft}>
				<NavButton type="primary" direction="left" onClick={() => onScroll("left")} />
			</div>
			<div css={styles.navRight}>
				<NavButton type="primary" direction="right" onClick={() => onScroll("right")} />
			</div>
		</div>
	);
}
