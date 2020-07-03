import React from "react";
import { BinocularIcon, BrowseIcon, HomeIcon, NavItem, Sidenav, SIDENAV_WIDTH } from "../src";
import styled from "@emotion/styled";

export default {
	title: "Sidenav",
	component: Sidenav,
};

const NAV_ITEMS: NavItem[] = [
	{
		name: "Home",
		icon: <HomeIcon />,
	},
	{
		name: "Discover",
		icon: <BinocularIcon />,
		subitems: [
			{
				name: "Channels 1",
			},
			{
				name: "Channels 2",
			},
			{
				name: "Channels 3",
			},
			{
				name: "Channels 4",
			},
			{
				name: "Channels 5",
			},
		],
	},
	{
		name: "Browse",
		icon: <BrowseIcon />,
		subitems: [
			{
				name: "Channels",
			},
		],
	},
];

export const Default = () => (
	<StoryStyles>
		<Sidenav items={NAV_ITEMS} />
		<ContentWrapper>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
			<p>Sensorem, barcas, et fraticinida. Zeta manducares, tanquam barbatus gallus.</p>
		</ContentWrapper>
	</StoryStyles>
);

// this is needed because proper storybook styling isn't merged yet
// TODO: remove
const StoryStyles = styled.div`
	color: white;
	* {
		box-sizing: border-box;
	}
`;

const ContentWrapper = styled.div`
	margin-left: ${SIDENAV_WIDTH}px;
`;
