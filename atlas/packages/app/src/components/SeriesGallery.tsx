import React from "react";
import { css } from "@emotion/core";
import { Gallery, SeriesPreview } from "@joystream/components";

type SeriesGalleryProps = {
	title?: string;
};

const series = [
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/1885/2678/5bd8a45ed7ef3717d7da8d86f63f42a6?Expires=1593993600&Signature=Ko2u0OOvVm-pboQJF24EQJa23GbfFyh5gRu9XI755iow8yBljl94NddLWKTx2jM49V9L3PFGwDIEhgo3fcymz0ITX6K0HPNyPS6DbGdn7qsjvSMnqhjpkGGas2LTCLPnhmC65fUaBPQpPhSV77ptlFnjyx9j4cy3rabp0cNh9e6~en7yMlIlBmaYKLYByVcTXKxNdJI1M~QhactVw8KDwYnXRVOFoJBuxhA1R4FQB1BHrACrViOjXh9puWDqNOkDYRDI9JKjHZelEpPpl1eU3oudsuN9IuANSNiASWfcXPd7mFDUozF0VpOBQTWrKdUMfAfOZ83gc4NeKGo9l83JFQ__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		series: "Series Name",
		channel: "Channel Name",
		poster:
			"https://s3-alpha-sig.figma.com/img/bd1c/f08d/2e5296745a67f795f74c976182d7eb54?Expires=1593993600&Signature=DhHoAZoGtrtjfr7dtFCf6zj6YlthtbQavorx1Le7Y8Il0NZquPCjY0VFjVHZUjecukXhUiWkr~X9QM3xgxOCkjGV1GApl5Fo7Bv8DLeOz5XmCMvF4wvpfTyNQ8WUPlePmFzqyIzuYcn~4-H2Uh3QNDi7hCY3mGsChrslIR8LzuukDuQ~~Jyx~PWJf96eqxq74SUVPVVIUPXmwFIFjkpq3TSWCWWkN9MvoUiXwxsGqQHhb1W7-m52ofNZcedkHA2DAvLmF46erA9Bzb3JT2ClY86UIGdn2eokfLxCmEVx8KhTtWozfDaJEJ~lkK8cJIdTH9~3ipUZtoWIwL~JHFsV5Q__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
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
					key={series.series}
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
