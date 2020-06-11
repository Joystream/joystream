import React, { useRef } from "react";
import { useCSS, CarouselStyleProps } from "./Carousel.style";
import NavButton from "../NavButton";

type CarouselProps = {
	children: React.ReactNode[];
	scrollAmount?: Number;
} & CarouselStyleProps;

export default function Carousel({ children, scrollAmount = 200, ...styleProps }: CarouselProps) {
	const container = useRef(null);

	let styles = useCSS(styleProps);

	return (
		<div css={styles.wrapper}>
			<div ref={container} css={styles.container}>
				{children.map((item, index) => (
					<div key={`carousel-${index}`} css={styles.item}>
						{item}
					</div>
				))}
			</div>
			<div css={styles.navLeft}>
				<NavButton type="primary" direction="left" onClick={() => {}} />
			</div>
			<div css={styles.navRight}>
				<NavButton type="primary" direction="right" onClick={() => {}} />
			</div>
		</div>
	);
}
