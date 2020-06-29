import React from "react";
import { SerializedStyles } from "@emotion/core";
import { ChannelPreviewStyleProps, useCSS } from "./ChannelPreview.style";
import Avatar from "../Avatar/Avatar";

type ChannelPreviewProps = {
	views: string;
	channel: string;
	channelAvatar: string;
	outerContainerCss: SerializedStyles;
} & ChannelPreviewStyleProps;

export default function ChannelPreview({
	views,
	channel,
	channelAvatar,
	outerContainerCss,
	...styleProps
}: Partial<ChannelPreviewProps>) {
	const styles = useCSS({ ...styleProps });
	return (
		<article css={[styles.outerContainer, outerContainerCss]}>
			<div css={styles.innerContainer}>
				<Avatar outerStyles={styles.avatar} img={channelAvatar} />
				<div css={styles.info}>
					<h2>{channel}</h2>
					<span>{views} views</span>
				</div>
			</div>
		</article>
	);
}
