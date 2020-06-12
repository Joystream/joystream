import React from "react";
import { css } from "@emotion/core";
import Gallery from "./Gallery";
import { SeriesPreview } from "@joystream/components";

type SeriesGalleryProps = {
	title?: string;
};

const series = [
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1592784000&Signature=McYeMoviUMseqXMvYRsgDji2wDzxgZ1~uEBWcO0fOkanY7jrk1~x7ekbZU1STsLJFAA3qM2YXF9VhOcC8QheqOB65GLOO3B9qJlHcCtLiZ3rQjbO-N7qCfWzVq0g5j4LIr-Rg4Iy6I9ma-zUK1AueehDonk9MC6DsCNcrbTy6Tr~3R5IrFWe7uRdnzowIOyjk1vvhX2yUcA~O0jhpMjKPoqL-MSljF15nnNRvk~lFRKPjxSrAqGKW0wxzbHnVURw7CLZadbloLd6B9dbHY~KwD-6KSuRtp9tPdKx9Bs~yNkeP-3ObYLRtiCr7CjD3-DTIFOD6ez4WDZuhDPu69HE2w__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
];
export default function SeriesGallery({ title }: SeriesGalleryProps) {
	return (
		<Gallery title={title}>
			{series.map((series) => (
				<SeriesPreview
					channel={series.channel}
					poster={series.poster}
					series={series.series}
					outerCss={css`
						margin: auto 1.5rem auto 0;
					`}
				/>
			))}
		</Gallery>
	);
}
