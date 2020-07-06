import React, { useState } from "react";
import { animated, useSpring, useTransition } from "react-spring";
import useResizeObserver from "use-resize-observer";
import HamburgerButton from "../HamburgerButton";
import { EXPANDED_SIDENAV_WIDTH, SIDENAV_WIDTH, useNavItemCSS, useSidenavCSS } from "./Sidenav.style";

type NavSubitem = {
	name: string;
};

export type NavItem = {
	subitems?: NavSubitem[];
	icon: React.ReactNode;
} & NavSubitem;

type SidenavProps = {
	items: NavItem[];
};

const Sidenav: React.FC<SidenavProps> = ({ items }) => {
	const [expanded, setExpanded] = useState(false);
	const styles = useSidenavCSS({ expanded });

	const containerAnimationStyles = useSpring({
		from: { width: SIDENAV_WIDTH },
		width: expanded ? EXPANDED_SIDENAV_WIDTH : SIDENAV_WIDTH,
	});
	const overlayTransitions = useTransition(expanded, null, {
		from: { opacity: 0, display: "none" },
		enter: { opacity: 1, display: "block" },
		leave: { opacity: 0 },
	});

	return (
		<>
			<animated.nav css={styles.nav} style={containerAnimationStyles}>
				<HamburgerButton
					active={expanded}
					onClick={() => setExpanded(!expanded)}
					outerStyles={styles.expandButton}
				/>
				<div css={styles.navItemsWrapper}>
					{items.map((item) => (
						<NavItem key={item.name} expanded={expanded} subitems={item.subitems}>
							{item.icon}
							<span>{item.name}</span>
						</NavItem>
					))}
				</div>
			</animated.nav>
			{overlayTransitions.map(
				({ item, key, props }) =>
					item && (
						<animated.div
							css={styles.drawerOverlay}
							key={key}
							style={props}
							onClick={() => setExpanded(false)}
						/>
					)
			)}
		</>
	);
};

type NavItemProps = {
	subitems?: NavSubitem[];
	expanded: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ expanded, subitems, children }) => {
	const styles = useNavItemCSS({ expanded });
	const { height: subitemsHeight, ref: subitemsRef } = useResizeObserver<HTMLDivElement>();
	const subitemsAnimationStyles = useSpring({ height: expanded ? subitemsHeight || 0 : 0 });

	return (
		<div css={styles.navItemContainer}>
			<a css={styles.navItem}>{children}</a>
			{subitems && (
				<animated.div css={styles.navSubitemsWrapper} style={subitemsAnimationStyles}>
					<div ref={subitemsRef}>
						{subitems.map((item) => (
							<a key={item.name} css={styles.navSubitem}>
								{item.name}
							</a>
						))}
					</div>
				</animated.div>
			)}
		</div>
	);
};

export default Sidenav;
