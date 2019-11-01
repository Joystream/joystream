import React from 'react'
import { Opening } from "@joystream/types/hiring"

type Props = {
	opening: Opening
}

export function OpeningView(props: Props) {
	return (
		<p>{props.opening.human_readable_text.headline}</p>
	)
}
