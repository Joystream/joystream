import React from "react";

import { makeStyles, VideoPreviewStyleProps } from "./VideoPreview.styles";
import Avatar from "./../Avatar";

type VideoPreviewProps = {
	title: string;
	channel?: string;
	channelImg?: string;
	showChannel?: boolean;
	showMeta?: boolean;
	time?: string;
	views?: string;
	poster?: string;
	onClick?: any;
	onChannelClick?: any;
} & VideoPreviewStyleProps;

export default function VideoPreview({
	title,
	channel,
	channelImg,
	showChannel = true,
	showMeta = true,
	time,
	views,
	poster,
	onClick,
	onChannelClick,
	...styleProps
}: VideoPreviewProps) {
	let styles = makeStyles({ showChannel, poster, ...styleProps });
	return (
		<div css={styles.container} onClick={onClick}>
			<div css={styles.coverContainer}>
				<div
					css={styles.cover}
					onClick={(event) => {
						event.stopPropagation();
						onClick();
					}}
				/>
			</div>
			<div css={styles.infoContainer}>
				{showChannel && (
					<Avatar
						size="small"
						img={channelImg}
						outerStyles={styles.avatar}
						onClick={(event) => {
							event.stopPropagation();
							onChannelClick();
						}}
					/>
				)}
				<div css={styles.textContainer}>
					<h3
						css={styles.title}
						onClick={(event) => {
							event.stopPropagation();
							onClick();
						}}
					>
						{title}
					</h3>
					{showChannel && (
						<span
							css={styles.channel}
							onClick={(event) => {
								event.stopPropagation();
								onChannelClick();
							}}
						>
							{channel}
						</span>
					)}
					{showMeta && (
						<span css={styles.meta}>
							{time}・{views} views
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
