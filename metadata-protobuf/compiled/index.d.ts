import { Long } from 'long'
import * as $protobuf from "protobufjs";
/** Properties of a ChannelMetadata. */
export interface IChannelMetadata {

    /** ChannelMetadata title */
    title?: (string|null);

    /** ChannelMetadata description */
    description?: (string|null);

    /** ChannelMetadata isPublic */
    isPublic?: (boolean|null);

    /** ChannelMetadata language */
    language?: (string|null);

    /** ChannelMetadata coverPhoto */
    coverPhoto?: (number|null);

    /** ChannelMetadata avatarPhoto */
    avatarPhoto?: (number|null);

    /** ChannelMetadata category */
    category?: (Long|null);
}

/** Represents a ChannelMetadata. */
export class ChannelMetadata implements IChannelMetadata {

    /**
     * Constructs a new ChannelMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IChannelMetadata);

    /** ChannelMetadata title. */
    public title: string;

    /** ChannelMetadata description. */
    public description: string;

    /** ChannelMetadata isPublic. */
    public isPublic: boolean;

    /** ChannelMetadata language. */
    public language: string;

    /** ChannelMetadata coverPhoto. */
    public coverPhoto: number;

    /** ChannelMetadata avatarPhoto. */
    public avatarPhoto: number;

    /** ChannelMetadata category. */
    public category: Long;

    /**
     * Creates a new ChannelMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ChannelMetadata instance
     */
    public static create(properties?: IChannelMetadata): ChannelMetadata;

    /**
     * Encodes the specified ChannelMetadata message. Does not implicitly {@link ChannelMetadata.verify|verify} messages.
     * @param message ChannelMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IChannelMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ChannelMetadata message, length delimited. Does not implicitly {@link ChannelMetadata.verify|verify} messages.
     * @param message ChannelMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IChannelMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ChannelMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ChannelMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ChannelMetadata;

    /**
     * Decodes a ChannelMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ChannelMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ChannelMetadata;

    /**
     * Verifies a ChannelMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ChannelMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ChannelMetadata
     */
    public static fromObject(object: { [k: string]: any }): ChannelMetadata;

    /**
     * Creates a plain object from a ChannelMetadata message. Also converts values to other types if specified.
     * @param message ChannelMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ChannelMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ChannelMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a ChannelCategoryMetadata. */
export interface IChannelCategoryMetadata {

    /** ChannelCategoryMetadata name */
    name?: (string|null);
}

/** Represents a ChannelCategoryMetadata. */
export class ChannelCategoryMetadata implements IChannelCategoryMetadata {

    /**
     * Constructs a new ChannelCategoryMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IChannelCategoryMetadata);

    /** ChannelCategoryMetadata name. */
    public name: string;

    /**
     * Creates a new ChannelCategoryMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ChannelCategoryMetadata instance
     */
    public static create(properties?: IChannelCategoryMetadata): ChannelCategoryMetadata;

    /**
     * Encodes the specified ChannelCategoryMetadata message. Does not implicitly {@link ChannelCategoryMetadata.verify|verify} messages.
     * @param message ChannelCategoryMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IChannelCategoryMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ChannelCategoryMetadata message, length delimited. Does not implicitly {@link ChannelCategoryMetadata.verify|verify} messages.
     * @param message ChannelCategoryMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IChannelCategoryMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ChannelCategoryMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ChannelCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ChannelCategoryMetadata;

    /**
     * Decodes a ChannelCategoryMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ChannelCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ChannelCategoryMetadata;

    /**
     * Verifies a ChannelCategoryMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ChannelCategoryMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ChannelCategoryMetadata
     */
    public static fromObject(object: { [k: string]: any }): ChannelCategoryMetadata;

    /**
     * Creates a plain object from a ChannelCategoryMetadata message. Also converts values to other types if specified.
     * @param message ChannelCategoryMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ChannelCategoryMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ChannelCategoryMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a PersonMetadata. */
export interface IPersonMetadata {

    /** PersonMetadata firstName */
    firstName?: (string|null);

    /** PersonMetadata middleName */
    middleName?: (string|null);

    /** PersonMetadata lastName */
    lastName?: (string|null);

    /** PersonMetadata about */
    about?: (string|null);

    /** PersonMetadata coverPhoto */
    coverPhoto?: (number|null);

    /** PersonMetadata avatarPhoto */
    avatarPhoto?: (number|null);
}

/** Represents a PersonMetadata. */
export class PersonMetadata implements IPersonMetadata {

    /**
     * Constructs a new PersonMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IPersonMetadata);

    /** PersonMetadata firstName. */
    public firstName: string;

    /** PersonMetadata middleName. */
    public middleName: string;

    /** PersonMetadata lastName. */
    public lastName: string;

    /** PersonMetadata about. */
    public about: string;

    /** PersonMetadata coverPhoto. */
    public coverPhoto: number;

    /** PersonMetadata avatarPhoto. */
    public avatarPhoto: number;

    /**
     * Creates a new PersonMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PersonMetadata instance
     */
    public static create(properties?: IPersonMetadata): PersonMetadata;

    /**
     * Encodes the specified PersonMetadata message. Does not implicitly {@link PersonMetadata.verify|verify} messages.
     * @param message PersonMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IPersonMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified PersonMetadata message, length delimited. Does not implicitly {@link PersonMetadata.verify|verify} messages.
     * @param message PersonMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IPersonMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a PersonMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PersonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): PersonMetadata;

    /**
     * Decodes a PersonMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns PersonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): PersonMetadata;

    /**
     * Verifies a PersonMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a PersonMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns PersonMetadata
     */
    public static fromObject(object: { [k: string]: any }): PersonMetadata;

    /**
     * Creates a plain object from a PersonMetadata message. Also converts values to other types if specified.
     * @param message PersonMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: PersonMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this PersonMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a PlaylistMetadata. */
export interface IPlaylistMetadata {

    /** PlaylistMetadata title */
    title?: (string|null);

    /** PlaylistMetadata videos */
    videos?: (Long[]|null);
}

/** Represents a PlaylistMetadata. */
export class PlaylistMetadata implements IPlaylistMetadata {

    /**
     * Constructs a new PlaylistMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IPlaylistMetadata);

    /** PlaylistMetadata title. */
    public title: string;

    /** PlaylistMetadata videos. */
    public videos: Long[];

    /**
     * Creates a new PlaylistMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PlaylistMetadata instance
     */
    public static create(properties?: IPlaylistMetadata): PlaylistMetadata;

    /**
     * Encodes the specified PlaylistMetadata message. Does not implicitly {@link PlaylistMetadata.verify|verify} messages.
     * @param message PlaylistMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IPlaylistMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified PlaylistMetadata message, length delimited. Does not implicitly {@link PlaylistMetadata.verify|verify} messages.
     * @param message PlaylistMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IPlaylistMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a PlaylistMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PlaylistMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): PlaylistMetadata;

    /**
     * Decodes a PlaylistMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns PlaylistMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): PlaylistMetadata;

    /**
     * Verifies a PlaylistMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a PlaylistMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns PlaylistMetadata
     */
    public static fromObject(object: { [k: string]: any }): PlaylistMetadata;

    /**
     * Creates a plain object from a PlaylistMetadata message. Also converts values to other types if specified.
     * @param message PlaylistMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: PlaylistMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this PlaylistMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a SeriesMetadata. */
export interface ISeriesMetadata {

    /** SeriesMetadata title */
    title?: (string|null);

    /** SeriesMetadata description */
    description?: (string|null);

    /** SeriesMetadata coverPhoto */
    coverPhoto?: (number|null);

    /** SeriesMetadata persons */
    persons?: (Long[]|null);
}

/** Represents a SeriesMetadata. */
export class SeriesMetadata implements ISeriesMetadata {

    /**
     * Constructs a new SeriesMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISeriesMetadata);

    /** SeriesMetadata title. */
    public title: string;

    /** SeriesMetadata description. */
    public description: string;

    /** SeriesMetadata coverPhoto. */
    public coverPhoto: number;

    /** SeriesMetadata persons. */
    public persons: Long[];

    /**
     * Creates a new SeriesMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SeriesMetadata instance
     */
    public static create(properties?: ISeriesMetadata): SeriesMetadata;

    /**
     * Encodes the specified SeriesMetadata message. Does not implicitly {@link SeriesMetadata.verify|verify} messages.
     * @param message SeriesMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISeriesMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SeriesMetadata message, length delimited. Does not implicitly {@link SeriesMetadata.verify|verify} messages.
     * @param message SeriesMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISeriesMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SeriesMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SeriesMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SeriesMetadata;

    /**
     * Decodes a SeriesMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SeriesMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SeriesMetadata;

    /**
     * Verifies a SeriesMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SeriesMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SeriesMetadata
     */
    public static fromObject(object: { [k: string]: any }): SeriesMetadata;

    /**
     * Creates a plain object from a SeriesMetadata message. Also converts values to other types if specified.
     * @param message SeriesMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SeriesMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SeriesMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a SeasonMetadata. */
export interface ISeasonMetadata {

    /** SeasonMetadata title */
    title?: (string|null);

    /** SeasonMetadata description */
    description?: (string|null);

    /** SeasonMetadata coverPhoto */
    coverPhoto?: (number|null);

    /** SeasonMetadata persons */
    persons?: (Long[]|null);
}

/** Represents a SeasonMetadata. */
export class SeasonMetadata implements ISeasonMetadata {

    /**
     * Constructs a new SeasonMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISeasonMetadata);

    /** SeasonMetadata title. */
    public title: string;

    /** SeasonMetadata description. */
    public description: string;

    /** SeasonMetadata coverPhoto. */
    public coverPhoto: number;

    /** SeasonMetadata persons. */
    public persons: Long[];

    /**
     * Creates a new SeasonMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SeasonMetadata instance
     */
    public static create(properties?: ISeasonMetadata): SeasonMetadata;

    /**
     * Encodes the specified SeasonMetadata message. Does not implicitly {@link SeasonMetadata.verify|verify} messages.
     * @param message SeasonMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISeasonMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SeasonMetadata message, length delimited. Does not implicitly {@link SeasonMetadata.verify|verify} messages.
     * @param message SeasonMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISeasonMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SeasonMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SeasonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SeasonMetadata;

    /**
     * Decodes a SeasonMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SeasonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SeasonMetadata;

    /**
     * Verifies a SeasonMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SeasonMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SeasonMetadata
     */
    public static fromObject(object: { [k: string]: any }): SeasonMetadata;

    /**
     * Creates a plain object from a SeasonMetadata message. Also converts values to other types if specified.
     * @param message SeasonMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SeasonMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SeasonMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a GeoCoordiantes. */
export interface IGeoCoordiantes {

    /** GeoCoordiantes latitude */
    latitude?: (number|null);

    /** GeoCoordiantes longitude */
    longitude?: (number|null);
}

/** Represents a GeoCoordiantes. */
export class GeoCoordiantes implements IGeoCoordiantes {

    /**
     * Constructs a new GeoCoordiantes.
     * @param [properties] Properties to set
     */
    constructor(properties?: IGeoCoordiantes);

    /** GeoCoordiantes latitude. */
    public latitude: number;

    /** GeoCoordiantes longitude. */
    public longitude: number;

    /**
     * Creates a new GeoCoordiantes instance using the specified properties.
     * @param [properties] Properties to set
     * @returns GeoCoordiantes instance
     */
    public static create(properties?: IGeoCoordiantes): GeoCoordiantes;

    /**
     * Encodes the specified GeoCoordiantes message. Does not implicitly {@link GeoCoordiantes.verify|verify} messages.
     * @param message GeoCoordiantes message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IGeoCoordiantes, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified GeoCoordiantes message, length delimited. Does not implicitly {@link GeoCoordiantes.verify|verify} messages.
     * @param message GeoCoordiantes message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IGeoCoordiantes, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a GeoCoordiantes message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns GeoCoordiantes
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): GeoCoordiantes;

    /**
     * Decodes a GeoCoordiantes message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns GeoCoordiantes
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): GeoCoordiantes;

    /**
     * Verifies a GeoCoordiantes message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a GeoCoordiantes message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GeoCoordiantes
     */
    public static fromObject(object: { [k: string]: any }): GeoCoordiantes;

    /**
     * Creates a plain object from a GeoCoordiantes message. Also converts values to other types if specified.
     * @param message GeoCoordiantes
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: GeoCoordiantes, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this GeoCoordiantes to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a NodeLocationMetadata. */
export interface INodeLocationMetadata {

    /** NodeLocationMetadata countryCode */
    countryCode?: (string|null);

    /** NodeLocationMetadata city */
    city?: (string|null);

    /** NodeLocationMetadata coordinates */
    coordinates?: (IGeoCoordiantes|null);
}

/** Represents a NodeLocationMetadata. */
export class NodeLocationMetadata implements INodeLocationMetadata {

    /**
     * Constructs a new NodeLocationMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: INodeLocationMetadata);

    /** NodeLocationMetadata countryCode. */
    public countryCode: string;

    /** NodeLocationMetadata city. */
    public city: string;

    /** NodeLocationMetadata coordinates. */
    public coordinates?: (IGeoCoordiantes|null);

    /**
     * Creates a new NodeLocationMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns NodeLocationMetadata instance
     */
    public static create(properties?: INodeLocationMetadata): NodeLocationMetadata;

    /**
     * Encodes the specified NodeLocationMetadata message. Does not implicitly {@link NodeLocationMetadata.verify|verify} messages.
     * @param message NodeLocationMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: INodeLocationMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified NodeLocationMetadata message, length delimited. Does not implicitly {@link NodeLocationMetadata.verify|verify} messages.
     * @param message NodeLocationMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: INodeLocationMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a NodeLocationMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns NodeLocationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): NodeLocationMetadata;

    /**
     * Decodes a NodeLocationMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns NodeLocationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): NodeLocationMetadata;

    /**
     * Verifies a NodeLocationMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a NodeLocationMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns NodeLocationMetadata
     */
    public static fromObject(object: { [k: string]: any }): NodeLocationMetadata;

    /**
     * Creates a plain object from a NodeLocationMetadata message. Also converts values to other types if specified.
     * @param message NodeLocationMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: NodeLocationMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this NodeLocationMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a StorageBucketOperatorMetadata. */
export interface IStorageBucketOperatorMetadata {

    /** StorageBucketOperatorMetadata endpoint */
    endpoint?: (string|null);

    /** StorageBucketOperatorMetadata location */
    location?: (INodeLocationMetadata|null);

    /** StorageBucketOperatorMetadata extra */
    extra?: (string|null);
}

/** Represents a StorageBucketOperatorMetadata. */
export class StorageBucketOperatorMetadata implements IStorageBucketOperatorMetadata {

    /**
     * Constructs a new StorageBucketOperatorMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IStorageBucketOperatorMetadata);

    /** StorageBucketOperatorMetadata endpoint. */
    public endpoint: string;

    /** StorageBucketOperatorMetadata location. */
    public location?: (INodeLocationMetadata|null);

    /** StorageBucketOperatorMetadata extra. */
    public extra: string;

    /**
     * Creates a new StorageBucketOperatorMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns StorageBucketOperatorMetadata instance
     */
    public static create(properties?: IStorageBucketOperatorMetadata): StorageBucketOperatorMetadata;

    /**
     * Encodes the specified StorageBucketOperatorMetadata message. Does not implicitly {@link StorageBucketOperatorMetadata.verify|verify} messages.
     * @param message StorageBucketOperatorMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IStorageBucketOperatorMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified StorageBucketOperatorMetadata message, length delimited. Does not implicitly {@link StorageBucketOperatorMetadata.verify|verify} messages.
     * @param message StorageBucketOperatorMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IStorageBucketOperatorMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a StorageBucketOperatorMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns StorageBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): StorageBucketOperatorMetadata;

    /**
     * Decodes a StorageBucketOperatorMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns StorageBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): StorageBucketOperatorMetadata;

    /**
     * Verifies a StorageBucketOperatorMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a StorageBucketOperatorMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns StorageBucketOperatorMetadata
     */
    public static fromObject(object: { [k: string]: any }): StorageBucketOperatorMetadata;

    /**
     * Creates a plain object from a StorageBucketOperatorMetadata message. Also converts values to other types if specified.
     * @param message StorageBucketOperatorMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: StorageBucketOperatorMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this StorageBucketOperatorMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a DistributionBucketOperatorMetadata. */
export interface IDistributionBucketOperatorMetadata {

    /** DistributionBucketOperatorMetadata endpoint */
    endpoint?: (string|null);

    /** DistributionBucketOperatorMetadata location */
    location?: (INodeLocationMetadata|null);

    /** DistributionBucketOperatorMetadata extra */
    extra?: (string|null);
}

/** Represents a DistributionBucketOperatorMetadata. */
export class DistributionBucketOperatorMetadata implements IDistributionBucketOperatorMetadata {

    /**
     * Constructs a new DistributionBucketOperatorMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IDistributionBucketOperatorMetadata);

    /** DistributionBucketOperatorMetadata endpoint. */
    public endpoint: string;

    /** DistributionBucketOperatorMetadata location. */
    public location?: (INodeLocationMetadata|null);

    /** DistributionBucketOperatorMetadata extra. */
    public extra: string;

    /**
     * Creates a new DistributionBucketOperatorMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns DistributionBucketOperatorMetadata instance
     */
    public static create(properties?: IDistributionBucketOperatorMetadata): DistributionBucketOperatorMetadata;

    /**
     * Encodes the specified DistributionBucketOperatorMetadata message. Does not implicitly {@link DistributionBucketOperatorMetadata.verify|verify} messages.
     * @param message DistributionBucketOperatorMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IDistributionBucketOperatorMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified DistributionBucketOperatorMetadata message, length delimited. Does not implicitly {@link DistributionBucketOperatorMetadata.verify|verify} messages.
     * @param message DistributionBucketOperatorMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IDistributionBucketOperatorMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a DistributionBucketOperatorMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns DistributionBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): DistributionBucketOperatorMetadata;

    /**
     * Decodes a DistributionBucketOperatorMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns DistributionBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): DistributionBucketOperatorMetadata;

    /**
     * Verifies a DistributionBucketOperatorMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a DistributionBucketOperatorMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DistributionBucketOperatorMetadata
     */
    public static fromObject(object: { [k: string]: any }): DistributionBucketOperatorMetadata;

    /**
     * Creates a plain object from a DistributionBucketOperatorMetadata message. Also converts values to other types if specified.
     * @param message DistributionBucketOperatorMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: DistributionBucketOperatorMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this DistributionBucketOperatorMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a DistributionBucketFamilyMetadata. */
export interface IDistributionBucketFamilyMetadata {

    /** DistributionBucketFamilyMetadata region */
    region?: (string|null);

    /** DistributionBucketFamilyMetadata description */
    description?: (string|null);

    /** DistributionBucketFamilyMetadata boundary */
    boundary?: (IGeoCoordiantes[]|null);
}

/** Represents a DistributionBucketFamilyMetadata. */
export class DistributionBucketFamilyMetadata implements IDistributionBucketFamilyMetadata {

    /**
     * Constructs a new DistributionBucketFamilyMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IDistributionBucketFamilyMetadata);

    /** DistributionBucketFamilyMetadata region. */
    public region: string;

    /** DistributionBucketFamilyMetadata description. */
    public description: string;

    /** DistributionBucketFamilyMetadata boundary. */
    public boundary: IGeoCoordiantes[];

    /**
     * Creates a new DistributionBucketFamilyMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns DistributionBucketFamilyMetadata instance
     */
    public static create(properties?: IDistributionBucketFamilyMetadata): DistributionBucketFamilyMetadata;

    /**
     * Encodes the specified DistributionBucketFamilyMetadata message. Does not implicitly {@link DistributionBucketFamilyMetadata.verify|verify} messages.
     * @param message DistributionBucketFamilyMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IDistributionBucketFamilyMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified DistributionBucketFamilyMetadata message, length delimited. Does not implicitly {@link DistributionBucketFamilyMetadata.verify|verify} messages.
     * @param message DistributionBucketFamilyMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IDistributionBucketFamilyMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a DistributionBucketFamilyMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns DistributionBucketFamilyMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): DistributionBucketFamilyMetadata;

    /**
     * Decodes a DistributionBucketFamilyMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns DistributionBucketFamilyMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): DistributionBucketFamilyMetadata;

    /**
     * Verifies a DistributionBucketFamilyMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a DistributionBucketFamilyMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DistributionBucketFamilyMetadata
     */
    public static fromObject(object: { [k: string]: any }): DistributionBucketFamilyMetadata;

    /**
     * Creates a plain object from a DistributionBucketFamilyMetadata message. Also converts values to other types if specified.
     * @param message DistributionBucketFamilyMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: DistributionBucketFamilyMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this DistributionBucketFamilyMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a PublishedBeforeJoystream. */
export interface IPublishedBeforeJoystream {

    /** PublishedBeforeJoystream isPublished */
    isPublished?: (boolean|null);

    /** PublishedBeforeJoystream date */
    date?: (string|null);
}

/** Represents a PublishedBeforeJoystream. */
export class PublishedBeforeJoystream implements IPublishedBeforeJoystream {

    /**
     * Constructs a new PublishedBeforeJoystream.
     * @param [properties] Properties to set
     */
    constructor(properties?: IPublishedBeforeJoystream);

    /** PublishedBeforeJoystream isPublished. */
    public isPublished: boolean;

    /** PublishedBeforeJoystream date. */
    public date: string;

    /**
     * Creates a new PublishedBeforeJoystream instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PublishedBeforeJoystream instance
     */
    public static create(properties?: IPublishedBeforeJoystream): PublishedBeforeJoystream;

    /**
     * Encodes the specified PublishedBeforeJoystream message. Does not implicitly {@link PublishedBeforeJoystream.verify|verify} messages.
     * @param message PublishedBeforeJoystream message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IPublishedBeforeJoystream, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified PublishedBeforeJoystream message, length delimited. Does not implicitly {@link PublishedBeforeJoystream.verify|verify} messages.
     * @param message PublishedBeforeJoystream message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IPublishedBeforeJoystream, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a PublishedBeforeJoystream message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PublishedBeforeJoystream
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): PublishedBeforeJoystream;

    /**
     * Decodes a PublishedBeforeJoystream message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns PublishedBeforeJoystream
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): PublishedBeforeJoystream;

    /**
     * Verifies a PublishedBeforeJoystream message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a PublishedBeforeJoystream message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns PublishedBeforeJoystream
     */
    public static fromObject(object: { [k: string]: any }): PublishedBeforeJoystream;

    /**
     * Creates a plain object from a PublishedBeforeJoystream message. Also converts values to other types if specified.
     * @param message PublishedBeforeJoystream
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: PublishedBeforeJoystream, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this PublishedBeforeJoystream to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a License. */
export interface ILicense {

    /** License code */
    code?: (number|null);

    /** License attribution */
    attribution?: (string|null);

    /** License customText */
    customText?: (string|null);
}

/** Represents a License. */
export class License implements ILicense {

    /**
     * Constructs a new License.
     * @param [properties] Properties to set
     */
    constructor(properties?: ILicense);

    /** License code. */
    public code: number;

    /** License attribution. */
    public attribution: string;

    /** License customText. */
    public customText: string;

    /**
     * Creates a new License instance using the specified properties.
     * @param [properties] Properties to set
     * @returns License instance
     */
    public static create(properties?: ILicense): License;

    /**
     * Encodes the specified License message. Does not implicitly {@link License.verify|verify} messages.
     * @param message License message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ILicense, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified License message, length delimited. Does not implicitly {@link License.verify|verify} messages.
     * @param message License message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ILicense, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a License message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns License
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): License;

    /**
     * Decodes a License message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns License
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): License;

    /**
     * Verifies a License message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a License message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns License
     */
    public static fromObject(object: { [k: string]: any }): License;

    /**
     * Creates a plain object from a License message. Also converts values to other types if specified.
     * @param message License
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: License, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this License to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a MediaType. */
export interface IMediaType {

    /** MediaType codecName */
    codecName?: (string|null);

    /** MediaType container */
    container?: (string|null);

    /** MediaType mimeMediaType */
    mimeMediaType?: (string|null);
}

/** Represents a MediaType. */
export class MediaType implements IMediaType {

    /**
     * Constructs a new MediaType.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMediaType);

    /** MediaType codecName. */
    public codecName: string;

    /** MediaType container. */
    public container: string;

    /** MediaType mimeMediaType. */
    public mimeMediaType: string;

    /**
     * Creates a new MediaType instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MediaType instance
     */
    public static create(properties?: IMediaType): MediaType;

    /**
     * Encodes the specified MediaType message. Does not implicitly {@link MediaType.verify|verify} messages.
     * @param message MediaType message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMediaType, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified MediaType message, length delimited. Does not implicitly {@link MediaType.verify|verify} messages.
     * @param message MediaType message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IMediaType, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a MediaType message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MediaType
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): MediaType;

    /**
     * Decodes a MediaType message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MediaType
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): MediaType;

    /**
     * Verifies a MediaType message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a MediaType message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MediaType
     */
    public static fromObject(object: { [k: string]: any }): MediaType;

    /**
     * Creates a plain object from a MediaType message. Also converts values to other types if specified.
     * @param message MediaType
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: MediaType, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this MediaType to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a VideoMetadata. */
export interface IVideoMetadata {

    /** VideoMetadata title */
    title?: (string|null);

    /** VideoMetadata description */
    description?: (string|null);

    /** VideoMetadata video */
    video?: (number|null);

    /** VideoMetadata thumbnailPhoto */
    thumbnailPhoto?: (number|null);

    /** VideoMetadata duration */
    duration?: (number|null);

    /** VideoMetadata mediaPixelHeight */
    mediaPixelHeight?: (number|null);

    /** VideoMetadata mediaPixelWidth */
    mediaPixelWidth?: (number|null);

    /** VideoMetadata mediaType */
    mediaType?: (IMediaType|null);

    /** VideoMetadata language */
    language?: (string|null);

    /** VideoMetadata license */
    license?: (ILicense|null);

    /** VideoMetadata publishedBeforeJoystream */
    publishedBeforeJoystream?: (IPublishedBeforeJoystream|null);

    /** VideoMetadata hasMarketing */
    hasMarketing?: (boolean|null);

    /** VideoMetadata isPublic */
    isPublic?: (boolean|null);

    /** VideoMetadata isExplicit */
    isExplicit?: (boolean|null);

    /** VideoMetadata persons */
    persons?: (Long[]|null);

    /** VideoMetadata category */
    category?: (Long|null);
}

/** Represents a VideoMetadata. */
export class VideoMetadata implements IVideoMetadata {

    /**
     * Constructs a new VideoMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IVideoMetadata);

    /** VideoMetadata title. */
    public title: string;

    /** VideoMetadata description. */
    public description: string;

    /** VideoMetadata video. */
    public video: number;

    /** VideoMetadata thumbnailPhoto. */
    public thumbnailPhoto: number;

    /** VideoMetadata duration. */
    public duration: number;

    /** VideoMetadata mediaPixelHeight. */
    public mediaPixelHeight: number;

    /** VideoMetadata mediaPixelWidth. */
    public mediaPixelWidth: number;

    /** VideoMetadata mediaType. */
    public mediaType?: (IMediaType|null);

    /** VideoMetadata language. */
    public language: string;

    /** VideoMetadata license. */
    public license?: (ILicense|null);

    /** VideoMetadata publishedBeforeJoystream. */
    public publishedBeforeJoystream?: (IPublishedBeforeJoystream|null);

    /** VideoMetadata hasMarketing. */
    public hasMarketing: boolean;

    /** VideoMetadata isPublic. */
    public isPublic: boolean;

    /** VideoMetadata isExplicit. */
    public isExplicit: boolean;

    /** VideoMetadata persons. */
    public persons: Long[];

    /** VideoMetadata category. */
    public category: Long;

    /**
     * Creates a new VideoMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns VideoMetadata instance
     */
    public static create(properties?: IVideoMetadata): VideoMetadata;

    /**
     * Encodes the specified VideoMetadata message. Does not implicitly {@link VideoMetadata.verify|verify} messages.
     * @param message VideoMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IVideoMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified VideoMetadata message, length delimited. Does not implicitly {@link VideoMetadata.verify|verify} messages.
     * @param message VideoMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IVideoMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a VideoMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns VideoMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): VideoMetadata;

    /**
     * Decodes a VideoMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns VideoMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): VideoMetadata;

    /**
     * Verifies a VideoMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a VideoMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns VideoMetadata
     */
    public static fromObject(object: { [k: string]: any }): VideoMetadata;

    /**
     * Creates a plain object from a VideoMetadata message. Also converts values to other types if specified.
     * @param message VideoMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: VideoMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this VideoMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a VideoCategoryMetadata. */
export interface IVideoCategoryMetadata {

    /** VideoCategoryMetadata name */
    name?: (string|null);
}

/** Represents a VideoCategoryMetadata. */
export class VideoCategoryMetadata implements IVideoCategoryMetadata {

    /**
     * Constructs a new VideoCategoryMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IVideoCategoryMetadata);

    /** VideoCategoryMetadata name. */
    public name: string;

    /**
     * Creates a new VideoCategoryMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns VideoCategoryMetadata instance
     */
    public static create(properties?: IVideoCategoryMetadata): VideoCategoryMetadata;

    /**
     * Encodes the specified VideoCategoryMetadata message. Does not implicitly {@link VideoCategoryMetadata.verify|verify} messages.
     * @param message VideoCategoryMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IVideoCategoryMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified VideoCategoryMetadata message, length delimited. Does not implicitly {@link VideoCategoryMetadata.verify|verify} messages.
     * @param message VideoCategoryMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IVideoCategoryMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a VideoCategoryMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns VideoCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): VideoCategoryMetadata;

    /**
     * Decodes a VideoCategoryMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns VideoCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): VideoCategoryMetadata;

    /**
     * Verifies a VideoCategoryMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a VideoCategoryMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns VideoCategoryMetadata
     */
    public static fromObject(object: { [k: string]: any }): VideoCategoryMetadata;

    /**
     * Creates a plain object from a VideoCategoryMetadata message. Also converts values to other types if specified.
     * @param message VideoCategoryMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: VideoCategoryMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this VideoCategoryMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
