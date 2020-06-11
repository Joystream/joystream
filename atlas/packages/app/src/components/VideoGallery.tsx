import React from "react";
import { css } from "@emotion/core";

import { Carousel, VideoPreview, VideoPlayer } from "@joystream/components";

type VideoGalleryProps = {
	title: string;
};

function Video() {
	return <VideoPlayer poster="https://cdn.pixabay.com/photo/2016/02/19/15/46/dog-1210559__340.jpg" />;
}

function Item({ n }) {
	return <div>Your awesome Video number {n}</div>;
}

const sectionStyles = css`
	margin-bottom: 2rem;
	padding: 1rem;
`;

export default function VideoGallery({ title = "" }: VideoGalleryProps) {
	const items = Array.from({ length: 9 }, (_, i) => i);
	return (
		<section css={sectionStyles}>
			<h3>{title}</h3>
			<Carousel>
				{items.map((n) => (
					<Item n={n} />
				))}
			</Carousel>
		</section>
	);
}
