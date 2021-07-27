import { Long } from 'long'
import * as $protobuf from "protobufjs";
/** Properties of a GeoCoordiantes. */
export interface IGeoCoordiantes {

    /** GeoCoordiantes latitude */
    latitude: number;

    /** GeoCoordiantes longitude */
    longitude: number;
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
