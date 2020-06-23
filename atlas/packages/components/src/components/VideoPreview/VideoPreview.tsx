import React from "react";
import { makeStyles, VideoPreviewStyleProps } from "./VideoPreview.styles";
import Avatar from "./../Avatar";

type VideoPreviewProps = {
	title: string;
	channel: string;
	channelImg: string;
	showChannel: boolean;
	showMeta: boolean;
	time: string;
	views: string;
	poster: string;
	onClick: any;
	imgRef: React.Ref<HTMLImageElement>;
	onChannelClick: (e: React.MouseEvent<HTMLElement>) => void;
} & VideoPreviewStyleProps;

const VideoPreview: React.FC<Partial<VideoPreviewProps>> = ({
	title,
	channel,
	channelImg,
	showChannel,
	showMeta,
	time,
	views,
	imgRef,
	poster,
	onClick = () => {},
	onChannelClick = () => {},
	...styleProps
}) => {
	let styles = makeStyles({ showChannel, poster, ...styleProps });
	return (
		<div css={styles.container} onClick={onClick}>
			<div css={styles.coverContainer}>
				<img src={poster} ref={imgRef} css={styles.cover} alt={`${title} by ${title} thumbnail`} />
			</div>
			<div css={styles.infoContainer}>
				{showChannel && (
					<Avatar size="small" img={channelImg} outerStyles={styles.avatar} onClick={onChannelClick} />
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
						<span css={styles.channel} onClick={onChannelClick}>
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
};
export default VideoPreview;
