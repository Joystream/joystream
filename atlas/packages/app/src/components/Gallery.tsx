import React from "react";
import { css } from "@emotion/core";

import { Carousel, Button, theme } from "@joystream/components";

type GalleryProps = {
	title: string;
	children: React.ReactNode;
	onSeeAll: () => void;
	seeAll: boolean;
};

const styles = {
	section: css`
		margin-bottom: 2rem;
		padding: 1rem;
	`,
	headingContainer: css`
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		& > h4 {
			font-size: ${theme.typography.sizes.h4};
			margin-block: 1rem;
		}
	`,
};

export default function Gallery({ title = "", children, seeAll = false, onSeeAll }: Partial<GalleryProps>) {
	return (
		<section css={styles.section}>
			<div css={styles.headingContainer}>
				<h4>{title}</h4>
				{seeAll && (
					<Button type="tertiary" onClick={onSeeAll}>
						See All
					</Button>
				)}
			</div>
			<Carousel>{children}</Carousel>
		</section>
	);
}
