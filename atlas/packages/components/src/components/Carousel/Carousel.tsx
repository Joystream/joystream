import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { css, SerializedStyles } from "@emotion/core";
import { animated, useSpring } from "react-spring";
import useResizeObserver from "use-resize-observer";
import { useCSS, CarouselStyleProps } from "./Carousel.style";
import NavButton from "../NavButton";

type CarouselProps = {
	children: React.ReactNode;
	containerCss: SerializedStyles;
	leftControlCss: SerializedStyles;
	rightControlCss: SerializedStyles;
	onScroll: (direction: "left" | "right") => void;
} & CarouselStyleProps;

const Carousel: React.FC<Partial<CarouselProps>> = ({
	children,
	containerCss,
	leftControlCss,
	rightControlCss,
	onScroll = () => {},
}) => {
	if (!Array.isArray(children)) {
		return <>{children}</>;
	}
	let [props, set] = useSpring(() => ({
		transform: `translateX(0px)`,
	}));
	const [x, setX] = useState(0);
	const { width: containerWidth, ref: containerRef } = useResizeObserver<HTMLDivElement>();
	const elementsRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [childrensWidth, setChildrensWidth] = useState(0);
	useEffect(() => {
		elementsRefs.current = elementsRefs.current.slice(0, children.length);
		const childrensWidth = elementsRefs.current.reduce(
			(accWidth, el) => (el != null ? accWidth + el.clientWidth : accWidth),
			0
		);
		setChildrensWidth(childrensWidth);
	}, [children.length]);

	const styles = useCSS({});
	return (
		<div css={[styles.container, containerCss]}>
			<div css={styles.itemsContainer} ref={containerRef}>
				{children.map((element, idx) => (
					<animated.div
						style={props}
						key={`Carousel-${idx}`}
						ref={(el) => {
							elementsRefs.current[idx] = el;
							return el;
						}}
					>
						{element}
					</animated.div>
				))}
			</div>
			<NavButton
				outerCss={[styles.navLeft, leftControlCss]}
				direction="left"
				onClick={() => {
					handleScroll("left");
				}}
			/>
			<NavButton
				outerCss={[styles.navRight, rightControlCss]}
				direction="right"
				onClick={() => {
					handleScroll("right");
				}}
			/>
		</div>
	);

	function handleScroll(direction: "left" | "right") {
		if (containerWidth == null) {
			return;
		}
		let scrollAmount;
		switch (direction) {
			case "left": {
				// Prevent overscroll on the left
				scrollAmount = x + containerWidth >= 0 ? 0 : x + containerWidth;
				onScroll("left");
				break;
			}
			case "right": {
				// Prevent overscroll on the right
				scrollAmount =
					x - containerWidth <= -(childrensWidth - containerWidth)
						? -(childrensWidth - containerWidth)
						: x - containerWidth;
				onScroll("right");
				break;
			}
		}
		setX(scrollAmount);
		set({
			transform: `translateX(${scrollAmount}px)`,
		});
	}
};

export default Carousel;
