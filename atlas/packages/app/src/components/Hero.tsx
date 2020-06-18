import React from "react";
import { css } from "@emotion/core";
import { Header, Button } from "@joystream/components";

type HeroProps = {
	backgroundImg: string;
};
export default function Hero({ backgroundImg }: Partial<HeroProps>) {
	return (
		<div
			css={css`
				background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImg});
				background-size: cover;
				background-position: center;
			`}
		>
			<Header
				text="A user governed video platform"
				subtext="Lorem ipsum sit amet, consectetur adipiscing elit. Proin non nisl sollicitudin, tempor diam."
				cssTitle={css`
					font-size: 72px;
					line-height: 0.94;
				`}
				cssSubtitle={css`
					font-size: 18px;
					line-height: 1.33;
				`}
			>
				<Button>
					<span
						css={css`
							padding: 0 1rem;
						`}
					>
						Play
					</span>
				</Button>
				<Button type="secondary">Share</Button>
			</Header>
		</div>
	);
}
