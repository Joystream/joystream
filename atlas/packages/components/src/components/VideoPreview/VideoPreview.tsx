import React from "react";
import {
	ChannelName,
	Container,
	CoverContainer,
	CoverDurationOverlay,
	CoverHoverOverlay,
	CoverImage,
	InfoContainer,
	MetaText,
	ProgressBar,
	ProgressOverlay,
	StyledAvatar,
	TextContainer,
	TitleHeader,
} from "./VideoPreview.styles";
import Play from "../../../assets/play.svg";

type VideoPreviewProps = {
	title: string;
	channel: string;
	channelImg: string;
	showChannel: boolean;
	showMeta: boolean;
	createdAt: string;
	duration?: string;
	// video watch progress in percent (0-100)
	progress?: number;
	views: string;
	poster: string;
	imgRef: React.Ref<HTMLImageElement>;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	onChannelClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

const VideoPreview: React.FC<Partial<VideoPreviewProps>> = ({
	title,
	channel,
	channelImg,
	showChannel = true,
	showMeta = true,
	createdAt,
	duration,
	progress = 0,
	views,
	imgRef,
	poster,
	onClick,
	onChannelClick,
}) => {
	const clickable = !!onClick;
	const channelClickable = !!onChannelClick;

	const handleChannelClick = (e: React.MouseEvent<HTMLElement>) => {
		if (!onChannelClick) {
			return;
		}
		e.stopPropagation();
		onChannelClick(e);
	};

	const handleClick = (e: React.MouseEvent<HTMLElement>) => {
		if (!onClick) {
			return;
		}
		e.stopPropagation();
		onClick(e);
	};

	return (
		<Container onClick={handleClick} clickable={clickable}>
			<CoverContainer>
				<CoverImage src={poster} ref={imgRef} alt={`${title} by ${channel} thumbnail`} />
				{duration && <CoverDurationOverlay>{duration}</CoverDurationOverlay>}
				{!!progress && (
					<ProgressOverlay>
						<ProgressBar style={{ width: `${progress}%` }} />
					</ProgressOverlay>
				)}
				<CoverHoverOverlay>
					<Play />
				</CoverHoverOverlay>
			</CoverContainer>
			<InfoContainer>
				{showChannel && (
					<StyledAvatar
						size="small"
						name={channel}
						img={channelImg}
						channelClickable={channelClickable}
						onClick={handleChannelClick}
					/>
				)}
				<TextContainer>
					<TitleHeader>{title}</TitleHeader>
					{showChannel && (
						<ChannelName channelClickable={channelClickable} onClick={handleChannelClick}>
							{channel}
						</ChannelName>
					)}
					{showMeta && (
						<MetaText>
							{createdAt}・{views} views
						</MetaText>
					)}
				</TextContainer>
			</InfoContainer>
		</Container>
	);
};

export default VideoPreview;
