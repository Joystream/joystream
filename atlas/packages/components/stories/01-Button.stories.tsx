import React from "react";
import { Button } from "../src";
import { faBan } from "@fortawesome/free-solid-svg-icons";

export default {
	title: "Button",
	component: Button,
};

export const Primary = () => (
	<>
		<Button onClick={() => console.log("Button clicked!")}>Regular</Button>
		<Button size="small" onClick={() => console.log("Button clicked!")}>
			Small
		</Button>
		<Button size="smaller" onClick={() => console.log("Button clicked!")}>
			Smaller
		</Button>
	</>
);

export const Secondary = () => (
	<>
		<Button type="secondary">Regular</Button>
		<Button type="secondary" size="small">
			Small
		</Button>
		<Button type="secondary" size="smaller">
			Smaller
		</Button>
	</>
);

export const PrimaryFullSize = () => <Button full>Primary Full Size</Button>;

export const SecondaryFullSize = () => (
	<Button full type="secondary">
		Secondary Full Size
	</Button>
);

export const PrimaryWithIcon = () => (
	<>
		<Button icon={faBan}>Regular</Button>
		<Button icon={faBan} size="small">
			Small
		</Button>
		<Button icon={faBan} size="smaller">
			Smaller
		</Button>
	</>
);

export const SecondaryWithIcon = () => (
	<>
		<Button type="secondary" icon={faBan}>
			Regular
		</Button>
		<Button type="secondary" icon={faBan} size="small">
			Small
		</Button>
		<Button type="secondary" icon={faBan} size="smaller">
			Smaller
		</Button>
	</>
);

export const PrimaryWithoutText = () => (
	<>
		<Button icon={faBan} />
		<Button icon={faBan} size="small" />
		<Button icon={faBan} size="smaller" />
	</>
);

export const SecondaryWithoutText = () => (
	<>
		<Button type="secondary" icon={faBan} />
		<Button type="secondary" icon={faBan} size="small" />
		<Button type="secondary" icon={faBan} size="smaller" />
	</>
);

export const Disabled = () => (
	<>
		<Button disabled={true}>Disabled</Button>
		<Button disabled={true} icon={faBan}>
			Disabled with icon
		</Button>
		<Button disabled={true} icon={faBan} />
	</>
);
