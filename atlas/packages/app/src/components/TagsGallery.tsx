import React from "react";
import { TagButton, Gallery } from "@joystream/components";

const tags = [
	"finance",
	"Sport",
	"Health & Fitness",
	"lifestyle",
	"finance",
	"Sport",
	"Health & Fitness",
	"lifestyle",
	"finance",
	"Sport",
	"Health & Fitness",
	"lifestyle",
	"finance",
	"Sport",
	"Health & Fitness",
	"lifestyle",
];

type TagsProps = {
	title: string;
	action: string;
};

const TagsGallery: React.FC<Partial<TagsProps>> = ({ title, action }) => (
	<Gallery title={title} action={action}>
		{tags.map((tag) => (
			<TagButton key={tag}>{tag}</TagButton>
		))}
	</Gallery>
);

export default TagsGallery;
