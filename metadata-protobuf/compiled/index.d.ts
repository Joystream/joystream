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

/** Properties of a CouncilCandidacyNoteMetadata. */
export interface ICouncilCandidacyNoteMetadata {

    /** CouncilCandidacyNoteMetadata header */
    header?: (string|null);

    /** CouncilCandidacyNoteMetadata bulletPoints */
    bulletPoints?: (string[]|null);

    /** CouncilCandidacyNoteMetadata bannerImageUri */
    bannerImageUri?: (string|null);

    /** CouncilCandidacyNoteMetadata description */
    description?: (string|null);
}

/** Represents a CouncilCandidacyNoteMetadata. */
export class CouncilCandidacyNoteMetadata implements ICouncilCandidacyNoteMetadata {

    /**
     * Constructs a new CouncilCandidacyNoteMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICouncilCandidacyNoteMetadata);

    /** CouncilCandidacyNoteMetadata header. */
    public header: string;

    /** CouncilCandidacyNoteMetadata bulletPoints. */
    public bulletPoints: string[];

    /** CouncilCandidacyNoteMetadata bannerImageUri. */
    public bannerImageUri: string;

    /** CouncilCandidacyNoteMetadata description. */
    public description: string;

    /**
     * Creates a new CouncilCandidacyNoteMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CouncilCandidacyNoteMetadata instance
     */
    public static create(properties?: ICouncilCandidacyNoteMetadata): CouncilCandidacyNoteMetadata;

    /**
     * Encodes the specified CouncilCandidacyNoteMetadata message. Does not implicitly {@link CouncilCandidacyNoteMetadata.verify|verify} messages.
     * @param message CouncilCandidacyNoteMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICouncilCandidacyNoteMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CouncilCandidacyNoteMetadata message, length delimited. Does not implicitly {@link CouncilCandidacyNoteMetadata.verify|verify} messages.
     * @param message CouncilCandidacyNoteMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICouncilCandidacyNoteMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CouncilCandidacyNoteMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CouncilCandidacyNoteMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CouncilCandidacyNoteMetadata;

    /**
     * Decodes a CouncilCandidacyNoteMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CouncilCandidacyNoteMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CouncilCandidacyNoteMetadata;

    /**
     * Verifies a CouncilCandidacyNoteMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CouncilCandidacyNoteMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CouncilCandidacyNoteMetadata
     */
    public static fromObject(object: { [k: string]: any }): CouncilCandidacyNoteMetadata;

    /**
     * Creates a plain object from a CouncilCandidacyNoteMetadata message. Also converts values to other types if specified.
     * @param message CouncilCandidacyNoteMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CouncilCandidacyNoteMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CouncilCandidacyNoteMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a ForumPostReaction. */
export interface IForumPostReaction {
}

/** Represents a ForumPostReaction. */
export class ForumPostReaction implements IForumPostReaction {

    /**
     * Constructs a new ForumPostReaction.
     * @param [properties] Properties to set
     */
    constructor(properties?: IForumPostReaction);

    /**
     * Creates a new ForumPostReaction instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ForumPostReaction instance
     */
    public static create(properties?: IForumPostReaction): ForumPostReaction;

    /**
     * Encodes the specified ForumPostReaction message. Does not implicitly {@link ForumPostReaction.verify|verify} messages.
     * @param message ForumPostReaction message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IForumPostReaction, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ForumPostReaction message, length delimited. Does not implicitly {@link ForumPostReaction.verify|verify} messages.
     * @param message ForumPostReaction message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IForumPostReaction, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ForumPostReaction message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ForumPostReaction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ForumPostReaction;

    /**
     * Decodes a ForumPostReaction message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ForumPostReaction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ForumPostReaction;

    /**
     * Verifies a ForumPostReaction message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ForumPostReaction message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ForumPostReaction
     */
    public static fromObject(object: { [k: string]: any }): ForumPostReaction;

    /**
     * Creates a plain object from a ForumPostReaction message. Also converts values to other types if specified.
     * @param message ForumPostReaction
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ForumPostReaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ForumPostReaction to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

export namespace ForumPostReaction {

    /** Reaction enum. */
    enum Reaction {
        CANCEL = 0,
        LIKE = 1
    }
}

/** Properties of a ForumPostMetadata. */
export interface IForumPostMetadata {

    /** ForumPostMetadata text */
    text?: (string|null);

    /** ForumPostMetadata repliesTo */
    repliesTo?: (number|null);
}

/** Represents a ForumPostMetadata. */
export class ForumPostMetadata implements IForumPostMetadata {

    /**
     * Constructs a new ForumPostMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IForumPostMetadata);

    /** ForumPostMetadata text. */
    public text: string;

    /** ForumPostMetadata repliesTo. */
    public repliesTo: number;

    /**
     * Creates a new ForumPostMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ForumPostMetadata instance
     */
    public static create(properties?: IForumPostMetadata): ForumPostMetadata;

    /**
     * Encodes the specified ForumPostMetadata message. Does not implicitly {@link ForumPostMetadata.verify|verify} messages.
     * @param message ForumPostMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IForumPostMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ForumPostMetadata message, length delimited. Does not implicitly {@link ForumPostMetadata.verify|verify} messages.
     * @param message ForumPostMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IForumPostMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ForumPostMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ForumPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ForumPostMetadata;

    /**
     * Decodes a ForumPostMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ForumPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ForumPostMetadata;

    /**
     * Verifies a ForumPostMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ForumPostMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ForumPostMetadata
     */
    public static fromObject(object: { [k: string]: any }): ForumPostMetadata;

    /**
     * Creates a plain object from a ForumPostMetadata message. Also converts values to other types if specified.
     * @param message ForumPostMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ForumPostMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ForumPostMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a ForumThreadMetadata. */
export interface IForumThreadMetadata {

    /** ForumThreadMetadata title */
    title?: (string|null);

    /** ForumThreadMetadata tags */
    tags?: (string[]|null);
}

/** Represents a ForumThreadMetadata. */
export class ForumThreadMetadata implements IForumThreadMetadata {

    /**
     * Constructs a new ForumThreadMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IForumThreadMetadata);

    /** ForumThreadMetadata title. */
    public title: string;

    /** ForumThreadMetadata tags. */
    public tags: string[];

    /**
     * Creates a new ForumThreadMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ForumThreadMetadata instance
     */
    public static create(properties?: IForumThreadMetadata): ForumThreadMetadata;

    /**
     * Encodes the specified ForumThreadMetadata message. Does not implicitly {@link ForumThreadMetadata.verify|verify} messages.
     * @param message ForumThreadMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IForumThreadMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ForumThreadMetadata message, length delimited. Does not implicitly {@link ForumThreadMetadata.verify|verify} messages.
     * @param message ForumThreadMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IForumThreadMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ForumThreadMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ForumThreadMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ForumThreadMetadata;

    /**
     * Decodes a ForumThreadMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ForumThreadMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ForumThreadMetadata;

    /**
     * Verifies a ForumThreadMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ForumThreadMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ForumThreadMetadata
     */
    public static fromObject(object: { [k: string]: any }): ForumThreadMetadata;

    /**
     * Creates a plain object from a ForumThreadMetadata message. Also converts values to other types if specified.
     * @param message ForumThreadMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ForumThreadMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ForumThreadMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a MembershipMetadata. */
export interface IMembershipMetadata {

    /** MembershipMetadata name */
    name?: (string|null);

    /** MembershipMetadata avatar */
    avatar?: (number|null);

    /** MembershipMetadata about */
    about?: (string|null);
}

/** Represents a MembershipMetadata. */
export class MembershipMetadata implements IMembershipMetadata {

    /**
     * Constructs a new MembershipMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMembershipMetadata);

    /** MembershipMetadata name. */
    public name: string;

    /** MembershipMetadata avatar. */
    public avatar: number;

    /** MembershipMetadata about. */
    public about: string;

    /**
     * Creates a new MembershipMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MembershipMetadata instance
     */
    public static create(properties?: IMembershipMetadata): MembershipMetadata;

    /**
     * Encodes the specified MembershipMetadata message. Does not implicitly {@link MembershipMetadata.verify|verify} messages.
     * @param message MembershipMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMembershipMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified MembershipMetadata message, length delimited. Does not implicitly {@link MembershipMetadata.verify|verify} messages.
     * @param message MembershipMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IMembershipMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a MembershipMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MembershipMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): MembershipMetadata;

    /**
     * Decodes a MembershipMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MembershipMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): MembershipMetadata;

    /**
     * Verifies a MembershipMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a MembershipMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MembershipMetadata
     */
    public static fromObject(object: { [k: string]: any }): MembershipMetadata;

    /**
     * Creates a plain object from a MembershipMetadata message. Also converts values to other types if specified.
     * @param message MembershipMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: MembershipMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this MembershipMetadata to JSON.
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

/** Properties of a ProposalsDiscussionPostMetadata. */
export interface IProposalsDiscussionPostMetadata {

    /** ProposalsDiscussionPostMetadata text */
    text?: (string|null);

    /** ProposalsDiscussionPostMetadata repliesTo */
    repliesTo?: (number|null);
}

/** Represents a ProposalsDiscussionPostMetadata. */
export class ProposalsDiscussionPostMetadata implements IProposalsDiscussionPostMetadata {

    /**
     * Constructs a new ProposalsDiscussionPostMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IProposalsDiscussionPostMetadata);

    /** ProposalsDiscussionPostMetadata text. */
    public text: string;

    /** ProposalsDiscussionPostMetadata repliesTo. */
    public repliesTo: number;

    /**
     * Creates a new ProposalsDiscussionPostMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ProposalsDiscussionPostMetadata instance
     */
    public static create(properties?: IProposalsDiscussionPostMetadata): ProposalsDiscussionPostMetadata;

    /**
     * Encodes the specified ProposalsDiscussionPostMetadata message. Does not implicitly {@link ProposalsDiscussionPostMetadata.verify|verify} messages.
     * @param message ProposalsDiscussionPostMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IProposalsDiscussionPostMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ProposalsDiscussionPostMetadata message, length delimited. Does not implicitly {@link ProposalsDiscussionPostMetadata.verify|verify} messages.
     * @param message ProposalsDiscussionPostMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IProposalsDiscussionPostMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ProposalsDiscussionPostMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ProposalsDiscussionPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ProposalsDiscussionPostMetadata;

    /**
     * Decodes a ProposalsDiscussionPostMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ProposalsDiscussionPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ProposalsDiscussionPostMetadata;

    /**
     * Verifies a ProposalsDiscussionPostMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a ProposalsDiscussionPostMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ProposalsDiscussionPostMetadata
     */
    public static fromObject(object: { [k: string]: any }): ProposalsDiscussionPostMetadata;

    /**
     * Creates a plain object from a ProposalsDiscussionPostMetadata message. Also converts values to other types if specified.
     * @param message ProposalsDiscussionPostMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ProposalsDiscussionPostMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ProposalsDiscussionPostMetadata to JSON.
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

/** Properties of an OpeningMetadata. */
export interface IOpeningMetadata {

    /** OpeningMetadata shortDescription */
    shortDescription?: (string|null);

    /** OpeningMetadata description */
    description?: (string|null);

    /** OpeningMetadata hiringLimit */
    hiringLimit?: (number|null);

    /** OpeningMetadata expectedEndingTimestamp */
    expectedEndingTimestamp?: (number|null);

    /** OpeningMetadata applicationDetails */
    applicationDetails?: (string|null);

    /** OpeningMetadata applicationFormQuestions */
    applicationFormQuestions?: (OpeningMetadata.IApplicationFormQuestion[]|null);
}

/** Represents an OpeningMetadata. */
export class OpeningMetadata implements IOpeningMetadata {

    /**
     * Constructs a new OpeningMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IOpeningMetadata);

    /** OpeningMetadata shortDescription. */
    public shortDescription: string;

    /** OpeningMetadata description. */
    public description: string;

    /** OpeningMetadata hiringLimit. */
    public hiringLimit: number;

    /** OpeningMetadata expectedEndingTimestamp. */
    public expectedEndingTimestamp: number;

    /** OpeningMetadata applicationDetails. */
    public applicationDetails: string;

    /** OpeningMetadata applicationFormQuestions. */
    public applicationFormQuestions: OpeningMetadata.IApplicationFormQuestion[];

    /**
     * Creates a new OpeningMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns OpeningMetadata instance
     */
    public static create(properties?: IOpeningMetadata): OpeningMetadata;

    /**
     * Encodes the specified OpeningMetadata message. Does not implicitly {@link OpeningMetadata.verify|verify} messages.
     * @param message OpeningMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IOpeningMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified OpeningMetadata message, length delimited. Does not implicitly {@link OpeningMetadata.verify|verify} messages.
     * @param message OpeningMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IOpeningMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an OpeningMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns OpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): OpeningMetadata;

    /**
     * Decodes an OpeningMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns OpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): OpeningMetadata;

    /**
     * Verifies an OpeningMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates an OpeningMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns OpeningMetadata
     */
    public static fromObject(object: { [k: string]: any }): OpeningMetadata;

    /**
     * Creates a plain object from an OpeningMetadata message. Also converts values to other types if specified.
     * @param message OpeningMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: OpeningMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this OpeningMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

export namespace OpeningMetadata {

    /** Properties of an ApplicationFormQuestion. */
    interface IApplicationFormQuestion {

        /** ApplicationFormQuestion question */
        question?: (string|null);

        /** ApplicationFormQuestion type */
        type?: (OpeningMetadata.ApplicationFormQuestion.InputType|null);
    }

    /** Represents an ApplicationFormQuestion. */
    class ApplicationFormQuestion implements IApplicationFormQuestion {

        /**
         * Constructs a new ApplicationFormQuestion.
         * @param [properties] Properties to set
         */
        constructor(properties?: OpeningMetadata.IApplicationFormQuestion);

        /** ApplicationFormQuestion question. */
        public question: string;

        /** ApplicationFormQuestion type. */
        public type: OpeningMetadata.ApplicationFormQuestion.InputType;

        /**
         * Creates a new ApplicationFormQuestion instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ApplicationFormQuestion instance
         */
        public static create(properties?: OpeningMetadata.IApplicationFormQuestion): OpeningMetadata.ApplicationFormQuestion;

        /**
         * Encodes the specified ApplicationFormQuestion message. Does not implicitly {@link OpeningMetadata.ApplicationFormQuestion.verify|verify} messages.
         * @param message ApplicationFormQuestion message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: OpeningMetadata.IApplicationFormQuestion, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ApplicationFormQuestion message, length delimited. Does not implicitly {@link OpeningMetadata.ApplicationFormQuestion.verify|verify} messages.
         * @param message ApplicationFormQuestion message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: OpeningMetadata.IApplicationFormQuestion, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ApplicationFormQuestion message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ApplicationFormQuestion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): OpeningMetadata.ApplicationFormQuestion;

        /**
         * Decodes an ApplicationFormQuestion message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ApplicationFormQuestion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): OpeningMetadata.ApplicationFormQuestion;

        /**
         * Verifies an ApplicationFormQuestion message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ApplicationFormQuestion message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ApplicationFormQuestion
         */
        public static fromObject(object: { [k: string]: any }): OpeningMetadata.ApplicationFormQuestion;

        /**
         * Creates a plain object from an ApplicationFormQuestion message. Also converts values to other types if specified.
         * @param message ApplicationFormQuestion
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: OpeningMetadata.ApplicationFormQuestion, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ApplicationFormQuestion to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace ApplicationFormQuestion {

        /** InputType enum. */
        enum InputType {
            TEXTAREA = 0,
            TEXT = 1
        }
    }
}

/** Properties of an UpcomingOpeningMetadata. */
export interface IUpcomingOpeningMetadata {

    /** UpcomingOpeningMetadata expectedStart */
    expectedStart?: (number|null);

    /** UpcomingOpeningMetadata rewardPerBlock */
    rewardPerBlock?: (Long|null);

    /** UpcomingOpeningMetadata minApplicationStake */
    minApplicationStake?: (Long|null);

    /** UpcomingOpeningMetadata metadata */
    metadata?: (IOpeningMetadata|null);
}

/** Represents an UpcomingOpeningMetadata. */
export class UpcomingOpeningMetadata implements IUpcomingOpeningMetadata {

    /**
     * Constructs a new UpcomingOpeningMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IUpcomingOpeningMetadata);

    /** UpcomingOpeningMetadata expectedStart. */
    public expectedStart: number;

    /** UpcomingOpeningMetadata rewardPerBlock. */
    public rewardPerBlock: Long;

    /** UpcomingOpeningMetadata minApplicationStake. */
    public minApplicationStake: Long;

    /** UpcomingOpeningMetadata metadata. */
    public metadata?: (IOpeningMetadata|null);

    /**
     * Creates a new UpcomingOpeningMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns UpcomingOpeningMetadata instance
     */
    public static create(properties?: IUpcomingOpeningMetadata): UpcomingOpeningMetadata;

    /**
     * Encodes the specified UpcomingOpeningMetadata message. Does not implicitly {@link UpcomingOpeningMetadata.verify|verify} messages.
     * @param message UpcomingOpeningMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IUpcomingOpeningMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified UpcomingOpeningMetadata message, length delimited. Does not implicitly {@link UpcomingOpeningMetadata.verify|verify} messages.
     * @param message UpcomingOpeningMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IUpcomingOpeningMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an UpcomingOpeningMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns UpcomingOpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): UpcomingOpeningMetadata;

    /**
     * Decodes an UpcomingOpeningMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns UpcomingOpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): UpcomingOpeningMetadata;

    /**
     * Verifies an UpcomingOpeningMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates an UpcomingOpeningMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UpcomingOpeningMetadata
     */
    public static fromObject(object: { [k: string]: any }): UpcomingOpeningMetadata;

    /**
     * Creates a plain object from an UpcomingOpeningMetadata message. Also converts values to other types if specified.
     * @param message UpcomingOpeningMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: UpcomingOpeningMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this UpcomingOpeningMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of an ApplicationMetadata. */
export interface IApplicationMetadata {

    /** ApplicationMetadata answers */
    answers?: (string[]|null);
}

/** Represents an ApplicationMetadata. */
export class ApplicationMetadata implements IApplicationMetadata {

    /**
     * Constructs a new ApplicationMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IApplicationMetadata);

    /** ApplicationMetadata answers. */
    public answers: string[];

    /**
     * Creates a new ApplicationMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ApplicationMetadata instance
     */
    public static create(properties?: IApplicationMetadata): ApplicationMetadata;

    /**
     * Encodes the specified ApplicationMetadata message. Does not implicitly {@link ApplicationMetadata.verify|verify} messages.
     * @param message ApplicationMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IApplicationMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified ApplicationMetadata message, length delimited. Does not implicitly {@link ApplicationMetadata.verify|verify} messages.
     * @param message ApplicationMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IApplicationMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an ApplicationMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ApplicationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ApplicationMetadata;

    /**
     * Decodes an ApplicationMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns ApplicationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ApplicationMetadata;

    /**
     * Verifies an ApplicationMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates an ApplicationMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ApplicationMetadata
     */
    public static fromObject(object: { [k: string]: any }): ApplicationMetadata;

    /**
     * Creates a plain object from an ApplicationMetadata message. Also converts values to other types if specified.
     * @param message ApplicationMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ApplicationMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ApplicationMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a WorkingGroupMetadata. */
export interface IWorkingGroupMetadata {

    /** WorkingGroupMetadata description */
    description?: (string|null);

    /** WorkingGroupMetadata about */
    about?: (string|null);

    /** WorkingGroupMetadata status */
    status?: (string|null);

    /** WorkingGroupMetadata statusMessage */
    statusMessage?: (string|null);
}

/** Represents a WorkingGroupMetadata. */
export class WorkingGroupMetadata implements IWorkingGroupMetadata {

    /**
     * Constructs a new WorkingGroupMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: IWorkingGroupMetadata);

    /** WorkingGroupMetadata description. */
    public description: string;

    /** WorkingGroupMetadata about. */
    public about: string;

    /** WorkingGroupMetadata status. */
    public status: string;

    /** WorkingGroupMetadata statusMessage. */
    public statusMessage: string;

    /**
     * Creates a new WorkingGroupMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns WorkingGroupMetadata instance
     */
    public static create(properties?: IWorkingGroupMetadata): WorkingGroupMetadata;

    /**
     * Encodes the specified WorkingGroupMetadata message. Does not implicitly {@link WorkingGroupMetadata.verify|verify} messages.
     * @param message WorkingGroupMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IWorkingGroupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified WorkingGroupMetadata message, length delimited. Does not implicitly {@link WorkingGroupMetadata.verify|verify} messages.
     * @param message WorkingGroupMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IWorkingGroupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a WorkingGroupMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns WorkingGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): WorkingGroupMetadata;

    /**
     * Decodes a WorkingGroupMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns WorkingGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): WorkingGroupMetadata;

    /**
     * Verifies a WorkingGroupMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a WorkingGroupMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns WorkingGroupMetadata
     */
    public static fromObject(object: { [k: string]: any }): WorkingGroupMetadata;

    /**
     * Creates a plain object from a WorkingGroupMetadata message. Also converts values to other types if specified.
     * @param message WorkingGroupMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: WorkingGroupMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this WorkingGroupMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a SetGroupMetadata. */
export interface ISetGroupMetadata {

    /** SetGroupMetadata newMetadata */
    newMetadata?: (IWorkingGroupMetadata|null);
}

/** Represents a SetGroupMetadata. */
export class SetGroupMetadata implements ISetGroupMetadata {

    /**
     * Constructs a new SetGroupMetadata.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISetGroupMetadata);

    /** SetGroupMetadata newMetadata. */
    public newMetadata?: (IWorkingGroupMetadata|null);

    /**
     * Creates a new SetGroupMetadata instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SetGroupMetadata instance
     */
    public static create(properties?: ISetGroupMetadata): SetGroupMetadata;

    /**
     * Encodes the specified SetGroupMetadata message. Does not implicitly {@link SetGroupMetadata.verify|verify} messages.
     * @param message SetGroupMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISetGroupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SetGroupMetadata message, length delimited. Does not implicitly {@link SetGroupMetadata.verify|verify} messages.
     * @param message SetGroupMetadata message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISetGroupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SetGroupMetadata message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SetGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SetGroupMetadata;

    /**
     * Decodes a SetGroupMetadata message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SetGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SetGroupMetadata;

    /**
     * Verifies a SetGroupMetadata message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SetGroupMetadata message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SetGroupMetadata
     */
    public static fromObject(object: { [k: string]: any }): SetGroupMetadata;

    /**
     * Creates a plain object from a SetGroupMetadata message. Also converts values to other types if specified.
     * @param message SetGroupMetadata
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SetGroupMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SetGroupMetadata to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of an AddUpcomingOpening. */
export interface IAddUpcomingOpening {

    /** AddUpcomingOpening metadata */
    metadata?: (IUpcomingOpeningMetadata|null);
}

/** Represents an AddUpcomingOpening. */
export class AddUpcomingOpening implements IAddUpcomingOpening {

    /**
     * Constructs a new AddUpcomingOpening.
     * @param [properties] Properties to set
     */
    constructor(properties?: IAddUpcomingOpening);

    /** AddUpcomingOpening metadata. */
    public metadata?: (IUpcomingOpeningMetadata|null);

    /**
     * Creates a new AddUpcomingOpening instance using the specified properties.
     * @param [properties] Properties to set
     * @returns AddUpcomingOpening instance
     */
    public static create(properties?: IAddUpcomingOpening): AddUpcomingOpening;

    /**
     * Encodes the specified AddUpcomingOpening message. Does not implicitly {@link AddUpcomingOpening.verify|verify} messages.
     * @param message AddUpcomingOpening message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IAddUpcomingOpening, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified AddUpcomingOpening message, length delimited. Does not implicitly {@link AddUpcomingOpening.verify|verify} messages.
     * @param message AddUpcomingOpening message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IAddUpcomingOpening, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an AddUpcomingOpening message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns AddUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): AddUpcomingOpening;

    /**
     * Decodes an AddUpcomingOpening message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns AddUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): AddUpcomingOpening;

    /**
     * Verifies an AddUpcomingOpening message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates an AddUpcomingOpening message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns AddUpcomingOpening
     */
    public static fromObject(object: { [k: string]: any }): AddUpcomingOpening;

    /**
     * Creates a plain object from an AddUpcomingOpening message. Also converts values to other types if specified.
     * @param message AddUpcomingOpening
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: AddUpcomingOpening, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this AddUpcomingOpening to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a RemoveUpcomingOpening. */
export interface IRemoveUpcomingOpening {

    /** RemoveUpcomingOpening id */
    id?: (string|null);
}

/** Represents a RemoveUpcomingOpening. */
export class RemoveUpcomingOpening implements IRemoveUpcomingOpening {

    /**
     * Constructs a new RemoveUpcomingOpening.
     * @param [properties] Properties to set
     */
    constructor(properties?: IRemoveUpcomingOpening);

    /** RemoveUpcomingOpening id. */
    public id: string;

    /**
     * Creates a new RemoveUpcomingOpening instance using the specified properties.
     * @param [properties] Properties to set
     * @returns RemoveUpcomingOpening instance
     */
    public static create(properties?: IRemoveUpcomingOpening): RemoveUpcomingOpening;

    /**
     * Encodes the specified RemoveUpcomingOpening message. Does not implicitly {@link RemoveUpcomingOpening.verify|verify} messages.
     * @param message RemoveUpcomingOpening message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IRemoveUpcomingOpening, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified RemoveUpcomingOpening message, length delimited. Does not implicitly {@link RemoveUpcomingOpening.verify|verify} messages.
     * @param message RemoveUpcomingOpening message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IRemoveUpcomingOpening, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a RemoveUpcomingOpening message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns RemoveUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): RemoveUpcomingOpening;

    /**
     * Decodes a RemoveUpcomingOpening message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns RemoveUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): RemoveUpcomingOpening;

    /**
     * Verifies a RemoveUpcomingOpening message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a RemoveUpcomingOpening message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns RemoveUpcomingOpening
     */
    public static fromObject(object: { [k: string]: any }): RemoveUpcomingOpening;

    /**
     * Creates a plain object from a RemoveUpcomingOpening message. Also converts values to other types if specified.
     * @param message RemoveUpcomingOpening
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: RemoveUpcomingOpening, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this RemoveUpcomingOpening to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a WorkingGroupMetadataAction. */
export interface IWorkingGroupMetadataAction {

    /** WorkingGroupMetadataAction setGroupMetadata */
    setGroupMetadata?: (ISetGroupMetadata|null);

    /** WorkingGroupMetadataAction addUpcomingOpening */
    addUpcomingOpening?: (IAddUpcomingOpening|null);

    /** WorkingGroupMetadataAction removeUpcomingOpening */
    removeUpcomingOpening?: (IRemoveUpcomingOpening|null);
}

/** Represents a WorkingGroupMetadataAction. */
export class WorkingGroupMetadataAction implements IWorkingGroupMetadataAction {

    /**
     * Constructs a new WorkingGroupMetadataAction.
     * @param [properties] Properties to set
     */
    constructor(properties?: IWorkingGroupMetadataAction);

    /** WorkingGroupMetadataAction setGroupMetadata. */
    public setGroupMetadata?: (ISetGroupMetadata|null);

    /** WorkingGroupMetadataAction addUpcomingOpening. */
    public addUpcomingOpening?: (IAddUpcomingOpening|null);

    /** WorkingGroupMetadataAction removeUpcomingOpening. */
    public removeUpcomingOpening?: (IRemoveUpcomingOpening|null);

    /** WorkingGroupMetadataAction action. */
    public action?: ("setGroupMetadata"|"addUpcomingOpening"|"removeUpcomingOpening");

    /**
     * Creates a new WorkingGroupMetadataAction instance using the specified properties.
     * @param [properties] Properties to set
     * @returns WorkingGroupMetadataAction instance
     */
    public static create(properties?: IWorkingGroupMetadataAction): WorkingGroupMetadataAction;

    /**
     * Encodes the specified WorkingGroupMetadataAction message. Does not implicitly {@link WorkingGroupMetadataAction.verify|verify} messages.
     * @param message WorkingGroupMetadataAction message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IWorkingGroupMetadataAction, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified WorkingGroupMetadataAction message, length delimited. Does not implicitly {@link WorkingGroupMetadataAction.verify|verify} messages.
     * @param message WorkingGroupMetadataAction message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IWorkingGroupMetadataAction, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a WorkingGroupMetadataAction message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns WorkingGroupMetadataAction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): WorkingGroupMetadataAction;

    /**
     * Decodes a WorkingGroupMetadataAction message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns WorkingGroupMetadataAction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): WorkingGroupMetadataAction;

    /**
     * Verifies a WorkingGroupMetadataAction message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a WorkingGroupMetadataAction message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns WorkingGroupMetadataAction
     */
    public static fromObject(object: { [k: string]: any }): WorkingGroupMetadataAction;

    /**
     * Creates a plain object from a WorkingGroupMetadataAction message. Also converts values to other types if specified.
     * @param message WorkingGroupMetadataAction
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: WorkingGroupMetadataAction, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this WorkingGroupMetadataAction to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
