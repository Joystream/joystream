import React from "react";
import { SerializedStyles } from "@emotion/core";
import { useCSS, SeriesPreviewStyleProps } from "./SeriesPreview.style";
import Avatar from "../Avatar/Avatar";

type SeriesPreviewProps = {
	series: string;
	channel: string;
	channelAvatar: string;
	poster: string;
	outerCss: SerializedStyles;
} & SeriesPreviewStyleProps;

export default function SeriesPreview({
	series,
	channel,
	channelAvatar,
	poster,
	outerCss,
	...styleProps
}: Partial<SeriesPreviewProps>) {
	const styles = useCSS({ poster, ...styleProps });
	return (
		<article css={[styles.container, outerCss]}>
			<div css={styles.info}>
				<Avatar img={channelAvatar} outerStyles={styles.avatar} />
				<div css={styles.text}>
					<h4>{series}</h4>
					<span>{channel}</span>
				</div>
			</div>
		</article>
	);
}
