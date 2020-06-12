import React from "react";
import { css } from "@emotion/core";
import Gallery from "./Gallery";
import { ChannelPreview } from "@joystream/components";

const channels = [
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/3408/13d0/9b77ae604c2991a867734c9bc7511bdb?Expires=1592784000&Signature=V80y4GG6ENSb07jATv~LM3OS9hD80U9uq7Yx45kCMpR1eQF9SUflcIKrdRSxlKtp3lJN~nvUX-swFddS4uMHdy0vJycFqAGT-U~h~XJMevIRAHEee6KW9dxpXBOKjuwuuhTmLi026hERGVx-i7zAW9r0kEtBE7oZwsVM-hwWxnoXVObmE7jF-snljQkcqfcyo54Mr7yWF5wHzSgX1EpO86K0-qyvny4T9WDk2NLVLkfKZfVW-G90y4BD8I~5G5H~T2mFJE8p~abO6HZyk~x4uxXdGF6Phcujm2kmblPlg-km6KoD11IkypG3uETOfh9MWNMBNeY9P9JfoKapVgj08g__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1592784000&Signature=PYA1Uoh5letgkluYpUqkV9rPPj8XIBmg-K5Rlc-i6OCo~qX7Sq7it2Xn8CU7utlKopi92MnNyqQiHzRoppvWjre8mgx2tIleOddDYRvqQnzQVfYaCj3eDeI6bjP3gz0OY3XVTJQApFiWdUShf3zTh5qLbLEILqtwiSrftYV9uPpxS8DvZgjV~IJ7657sCLLHFqzBZmQenv81N0KiNcEZo0wYTyEL28kazzu78k-Zb4LkWWHG726d~qB05GgcyWK4o8XoOvSZDrVJ0dORMPnG5F2O7CcpCuVZuAnPcT2dEFhMkI1ShjVgccA3Dp0ukJZZMq3gh5csXH2fJ3RUWLA2lg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
];

type ChannelGalleryProps = {
	title?: string;
};
export default function ChannelGallery({ title }: ChannelGalleryProps) {
	return (
		<Gallery title={title}>
			{channels.map((chan) => (
				<ChannelPreview
					channel={chan.channel}
					channelAvatar={chan.channelAvatar}
					key={chan.channel}
					views={chan.views}
					outerCss={css`
						margin: 1rem 1.5rem;
					`}
				/>
			))}
		</Gallery>
	);
}
