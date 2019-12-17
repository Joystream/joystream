import { u32, u64, Text, GenericAccountId } from '@polkadot/types';
import { BlockAndTime, ContentMetadata, SchemaId, ContentVisibility } from '@joystream/types/media';

type NewContentMetadataProps = {
	owner: string,
	block: number,
	time: number,
  visibility?: 'Public',
  schema?: number,
	name: string,
	description: string,
	thumbnail: string,
	keywords: string
}

export function newContentMetadata (props: NewContentMetadataProps) {
	const {
		owner,
		block,
		time,
    visibility = 'Public',
    schema = 0,
		name,
		description,
		thumbnail,
		keywords
	} = props;

	return new ContentMetadata({
		owner: new GenericAccountId(owner),
		added_at: new BlockAndTime({
			block: new u32(block),
			time: new u64(time)
		}),
		children_ids: [],
		visibility: new ContentVisibility(visibility),
		schema: new SchemaId(schema),
		json: new Text(JSON.stringify({
			name,
			description,
			thumbnail,
			keywords
		}))
	})
}
