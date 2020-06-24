import React from "react";
import { css } from "@emotion/core";
import { Header, Button } from "@joystream/components";

type HeroProps = {
	backgroundImg: string;
};

const Hero: React.FC<Partial<HeroProps>> = ({ backgroundImg }) => {
	return (
		<Header
			title="A user governed video platform"
			subtitle="Lorem ipsum sit amet, consectetur adipiscing elit. Proin non nisl sollicitudin, tempor diam."
			backgroundImg={backgroundImg}
			containerCss={css`
				font-size: 18px;
				line-height: 1.33;
				& h1 {
					font-size: 78px;
					line-height: 0.94;
				}
			`}
		>
			<div
				css={css`
					display: flex;
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
			</div>
		</Header>
	);
};
export default Hero;
// export default function Hero({ backgroundImg }: Partial<HeroProps>) {
// 	return (
// 		<div
// 			css={css`
// 				background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImg});
// 				background-size: cover;
// 				background-position: center;
// 			`}
// 		>
// 			<Header
// 				text="A user governed video platform"
// 				subtext="Lorem ipsum sit amet, consectetur adipiscing elit. Proin non nisl sollicitudin, tempor diam."
// 				cssTitle={css`
// 					font-size: 72px;
// 					line-height: 0.94;
// 				`}
// 				cssSubtitle={css`
// 					font-size: 18px;
// 					line-height: 1.33;
// 				`}
// 			>
// 				<Button>
// 					<span
// 						css={css`
// 							padding: 0 1rem;
// 						`}
// 					>
// 						Play
// 					</span>
// 				</Button>
// 				<Button type="secondary">Share</Button>
// 			</Header>
// 		</div>
// 	);
// }
