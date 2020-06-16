import React, { useState, useRef, useEffect, useCallback } from "react";
import { css } from "@emotion/core";
import { animated, useSpring } from "react-spring";
import { useCSS, CarouselStyleProps } from "./Carousel.style";
import NavButton from "../NavButton";

type CarouselProps = {
	children: React.ReactNode[];
	scrollAmount?: number;
	log?: boolean;
} & CarouselStyleProps;

export default function Carousel({ children, scrollAmount = 200, log, ...styleProps }: CarouselProps) {
	let styles = useCSS(styleProps);
	const containerRef = useRef<HTMLDivElement>(null);
	const elementsRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [distance, setDistance] = useState(0);
	const [maxDistance, setMaxDistance] = useState(Infinity);
	const [props, set] = useSpring(() => ({
		transform: `translateX(${distance}px)`,
	}));

	useEffect(() => {
		if (containerRef.current) {
			elementsRefs.current = elementsRefs.current.slice(0, children.length);
			const totalChildrensLength = elementsRefs.current.reduce(
				(accWidth, el) => (el != null ? accWidth + el.clientWidth : accWidth),
				0
			);
			const longestChildrenWidth = elementsRefs.current.reduce(
				(longest, el) => (el != null && el.clientWidth > longest ? el.clientWidth : longest),
				0
			);
			const containerWidth = containerRef.current.clientWidth;

			setMaxDistance(totalChildrensLength - containerWidth + longestChildrenWidth);
		}
	}, [children.length]);

	if (log) {
		console.log({
			totalChildrensLength: elementsRefs.current.reduce(
				(accWidth, el) => (el != null ? accWidth + el.clientWidth : accWidth),
				0
			),
			longestChildrenWidth: elementsRefs.current.reduce(
				(longest, el) => (el != null && el.clientWidth > longest ? el.clientWidth : longest),
				0
			),
			maxDistance,
			childrens: children.length,
			distance,
		});
	}
	const MIN_DISTANCE = 0;
	const MAX_DISTANCE = maxDistance;

	function handleScroll(direction: "right" | "left") {
		let newDist = NaN;

		switch (direction) {
			case "left": {
				newDist = distance + scrollAmount <= MIN_DISTANCE ? distance + scrollAmount : distance;
				break;
			}
			case "right": {
				newDist = distance - scrollAmount > -MAX_DISTANCE ? distance - scrollAmount : distance;
				break;
			}
		}
		console.log("newDist", newDist);
		setDistance(newDist);
		set({
			transform: `translateX(${newDist}px)`,
		});

		return newDist;
	}

	return (
		<div css={styles.container}>
			<div css={styles.innerContainer} ref={containerRef}>
				{children.map((item, idx) => (
					<animated.div
						style={props}
						key={`Carousel-${idx}`}
						ref={(el) => {
							elementsRefs.current[idx] = el;
							return el;
						}}
					>
						{item}
					</animated.div>
				))}
			</div>
			<div
				css={[
					styles.navLeft,
					css`
						opacity: ${distance === MIN_DISTANCE ? 0 : 1};
					`,
				]}
			>
				<NavButton type="primary" direction="left" onClick={() => handleScroll("left")} />
			</div>
			<div
				css={[
					styles.navRight,
					css`
						opacity: ${distance - scrollAmount < -MAX_DISTANCE ? 0 : 1};
					`,
				]}
			>
				<NavButton type="primary" direction="right" onClick={() => handleScroll("right")} />
			</div>
		</div>
	);
}
