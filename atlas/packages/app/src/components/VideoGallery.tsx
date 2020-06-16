import React from "react";
import { css } from "@emotion/core";

import { Carousel, VideoPreview, VideoPlayer, theme } from "@joystream/components";
import Gallery from "./Gallery";

type VideoGalleryProps = {
	title: string;
	log?: boolean;
};

function Video() {
	return (
		<VideoPreview
			title="Sample Video Title"
			channel="Channel Name"
			showChannel={true}
			views="345k"
			time="2 weeks ago"
			poster="https://s3-alpha-sig.figma.com/img/57d7/47bd/e40e51d45107656c92b3c9d982e76c6e?Expires=1592784000&Signature=aJk1gbAXBZiLM9AJzmnVlIBumH-2CksuaJurQwg6RSjKRwtUYWFC1-A~4n8YlJ2b7elUpxfywTeQprP6Cp0i23RLGM-O0gYHVn0JS61NJ8r4BFf49~CehI0A30iAauYbY52itIvy~KFZnA-GucA1MihuJssT0oTqDNOQEL~Ux~Q3ArmKjqEe6EZgQ72lBRw74EIQ7dEeZZ2A5DiO4t6j0-lQBQ-ii4zeH3jYgDac1ulio-k0Jd9eMblTHcc9K3vwFjDvfq9r27iIiUEcNg1jpA6hgpVAOVo3471A~1ULl6yWYFNOFgyPn6007PECrROWj8k1WYQ-zjSbNI5zaDmBBA__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA"
		/>
	);
}

const articleStyles = css`
	max-width: 320px;
	margin: auto ${theme.spacing.m};
`;

export default function VideoGallery({ title = "", log = false }: VideoGalleryProps) {
	const items = Array.from({ length: 15 }, (_, i) => i);
	return (
		<Gallery title={title} log={log}>
			{items.map((item) => (
				<article css={articleStyles} key={`${title}- ${item}`}>
					<Video />
				</article>
			))}
		</Gallery>
	);
}
