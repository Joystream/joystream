import React from "react";
import Gallery from "./Gallery";
import { TagButton } from "@joystream/components";

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
	title?: string;
};

export default function Tags({ title }: TagsProps) {
	return (
		<Gallery title={title}>
			{tags.map((tag) => (
				<TagButton key={tag}>{tag}</TagButton>
			))}
		</Gallery>
	);
}
