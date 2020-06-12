import React from "react";
import { SerializedStyles } from "@emotion/core";
import { ChannelPreviewStyleProps, useCSS } from "./ChannelPreview.style";
import Avatar from "../Avatar/Avatar";

type ChannelPreviewProps = {
	views: string;
	channel: string;
	channelAvatar: string;
	outerCss: SerializedStyles;
} & ChannelPreviewStyleProps;

export default function ChannelPreview({
	views,
	channel,
	channelAvatar,
	outerCss,
	...styleProps
}: Partial<ChannelPreviewProps>) {
	const styles = useCSS({ ...styleProps });
	return (
		<article css={[styles.container, outerCss]}>
			<Avatar outerStyles={styles.avatar} img={channelAvatar} />
			<div css={styles.info}>
				<h4>{channel}</h4>
				<span>{views} views</span>
			</div>
		</article>
	);
}
