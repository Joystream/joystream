import React from "react";
import { SerializedStyles } from "@emotion/core";
import { AvatarStyleProps, useCSS } from "./Avatar.style";

export type AvatarProps = {
	onClick: (e: React.MouseEvent<HTMLElement>) => void;
	outerStyles?: SerializedStyles;
	img: string;
	name: string;
	className?: string;
} & AvatarStyleProps;

function initialsFromName(name: string): string {
	const vowels = ["a", "e", "i", "o", "u", "y"];
	const [first = "", second = ""] = name.split("");
	return vowels.includes(second) ? first : `${first}${second}`;
}

const Avatar: React.FC<Partial<AvatarProps>> = ({
	img,
	outerStyles,
	onClick = () => {},
	name,
	className,
	...styleProps
}) => {
	const styles = useCSS({ ...styleProps });
	return (
		<div css={[styles.container, outerStyles]} className={className} onClick={onClick}>
			{img ? <img src={img} css={styles.img} /> : <span>{initialsFromName(name || "")}</span>}
		</div>
	);
};

export default Avatar;
