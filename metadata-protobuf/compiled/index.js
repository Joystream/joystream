/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.ChannelMetadata = (function() {

    /**
     * Properties of a ChannelMetadata.
     * @exports IChannelMetadata
     * @interface IChannelMetadata
     * @property {string|null} [title] ChannelMetadata title
     * @property {string|null} [description] ChannelMetadata description
     * @property {boolean|null} [isPublic] ChannelMetadata isPublic
     * @property {string|null} [language] ChannelMetadata language
     * @property {number|null} [coverPhoto] ChannelMetadata coverPhoto
     * @property {number|null} [avatarPhoto] ChannelMetadata avatarPhoto
     * @property {Long|null} [category] ChannelMetadata category
     */

    /**
     * Constructs a new ChannelMetadata.
     * @exports ChannelMetadata
     * @classdesc Represents a ChannelMetadata.
     * @implements IChannelMetadata
     * @constructor
     * @param {IChannelMetadata=} [properties] Properties to set
     */
    function ChannelMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChannelMetadata title.
     * @member {string} title
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.title = "";

    /**
     * ChannelMetadata description.
     * @member {string} description
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.description = "";

    /**
     * ChannelMetadata isPublic.
     * @member {boolean} isPublic
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.isPublic = false;

    /**
     * ChannelMetadata language.
     * @member {string} language
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.language = "";

    /**
     * ChannelMetadata coverPhoto.
     * @member {number} coverPhoto
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.coverPhoto = 0;

    /**
     * ChannelMetadata avatarPhoto.
     * @member {number} avatarPhoto
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.avatarPhoto = 0;

    /**
     * ChannelMetadata category.
     * @member {Long} category
     * @memberof ChannelMetadata
     * @instance
     */
    ChannelMetadata.prototype.category = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Creates a new ChannelMetadata instance using the specified properties.
     * @function create
     * @memberof ChannelMetadata
     * @static
     * @param {IChannelMetadata=} [properties] Properties to set
     * @returns {ChannelMetadata} ChannelMetadata instance
     */
    ChannelMetadata.create = function create(properties) {
        return new ChannelMetadata(properties);
    };

    /**
     * Encodes the specified ChannelMetadata message. Does not implicitly {@link ChannelMetadata.verify|verify} messages.
     * @function encode
     * @memberof ChannelMetadata
     * @static
     * @param {IChannelMetadata} message ChannelMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.title);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.isPublic != null && Object.hasOwnProperty.call(message, "isPublic"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.isPublic);
        if (message.language != null && Object.hasOwnProperty.call(message, "language"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.language);
        if (message.coverPhoto != null && Object.hasOwnProperty.call(message, "coverPhoto"))
            writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.coverPhoto);
        if (message.avatarPhoto != null && Object.hasOwnProperty.call(message, "avatarPhoto"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.avatarPhoto);
        if (message.category != null && Object.hasOwnProperty.call(message, "category"))
            writer.uint32(/* id 7, wireType 0 =*/56).uint64(message.category);
        return writer;
    };

    /**
     * Encodes the specified ChannelMetadata message, length delimited. Does not implicitly {@link ChannelMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ChannelMetadata
     * @static
     * @param {IChannelMetadata} message ChannelMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChannelMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof ChannelMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ChannelMetadata} ChannelMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ChannelMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.title = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.isPublic = reader.bool();
                break;
            case 4:
                message.language = reader.string();
                break;
            case 5:
                message.coverPhoto = reader.uint32();
                break;
            case 6:
                message.avatarPhoto = reader.uint32();
                break;
            case 7:
                message.category = reader.uint64();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ChannelMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ChannelMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ChannelMetadata} ChannelMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChannelMetadata message.
     * @function verify
     * @memberof ChannelMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChannelMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.isPublic != null && message.hasOwnProperty("isPublic"))
            if (typeof message.isPublic !== "boolean")
                return "isPublic: boolean expected";
        if (message.language != null && message.hasOwnProperty("language"))
            if (!$util.isString(message.language))
                return "language: string expected";
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            if (!$util.isInteger(message.coverPhoto))
                return "coverPhoto: integer expected";
        if (message.avatarPhoto != null && message.hasOwnProperty("avatarPhoto"))
            if (!$util.isInteger(message.avatarPhoto))
                return "avatarPhoto: integer expected";
        if (message.category != null && message.hasOwnProperty("category"))
            if (!$util.isInteger(message.category) && !(message.category && $util.isInteger(message.category.low) && $util.isInteger(message.category.high)))
                return "category: integer|Long expected";
        return null;
    };

    /**
     * Creates a ChannelMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ChannelMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ChannelMetadata} ChannelMetadata
     */
    ChannelMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.ChannelMetadata)
            return object;
        var message = new $root.ChannelMetadata();
        if (object.title != null)
            message.title = String(object.title);
        if (object.description != null)
            message.description = String(object.description);
        if (object.isPublic != null)
            message.isPublic = Boolean(object.isPublic);
        if (object.language != null)
            message.language = String(object.language);
        if (object.coverPhoto != null)
            message.coverPhoto = object.coverPhoto >>> 0;
        if (object.avatarPhoto != null)
            message.avatarPhoto = object.avatarPhoto >>> 0;
        if (object.category != null)
            if ($util.Long)
                (message.category = $util.Long.fromValue(object.category)).unsigned = true;
            else if (typeof object.category === "string")
                message.category = parseInt(object.category, 10);
            else if (typeof object.category === "number")
                message.category = object.category;
            else if (typeof object.category === "object")
                message.category = new $util.LongBits(object.category.low >>> 0, object.category.high >>> 0).toNumber(true);
        return message;
    };

    /**
     * Creates a plain object from a ChannelMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ChannelMetadata
     * @static
     * @param {ChannelMetadata} message ChannelMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChannelMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.title = "";
            object.description = "";
            object.isPublic = false;
            object.language = "";
            object.coverPhoto = 0;
            object.avatarPhoto = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.category = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.category = options.longs === String ? "0" : 0;
        }
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.isPublic != null && message.hasOwnProperty("isPublic"))
            object.isPublic = message.isPublic;
        if (message.language != null && message.hasOwnProperty("language"))
            object.language = message.language;
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            object.coverPhoto = message.coverPhoto;
        if (message.avatarPhoto != null && message.hasOwnProperty("avatarPhoto"))
            object.avatarPhoto = message.avatarPhoto;
        if (message.category != null && message.hasOwnProperty("category"))
            if (typeof message.category === "number")
                object.category = options.longs === String ? String(message.category) : message.category;
            else
                object.category = options.longs === String ? $util.Long.prototype.toString.call(message.category) : options.longs === Number ? new $util.LongBits(message.category.low >>> 0, message.category.high >>> 0).toNumber(true) : message.category;
        return object;
    };

    /**
     * Converts this ChannelMetadata to JSON.
     * @function toJSON
     * @memberof ChannelMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChannelMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return ChannelMetadata;
})();

$root.ChannelCategoryMetadata = (function() {

    /**
     * Properties of a ChannelCategoryMetadata.
     * @exports IChannelCategoryMetadata
     * @interface IChannelCategoryMetadata
     * @property {string|null} [name] ChannelCategoryMetadata name
     */

    /**
     * Constructs a new ChannelCategoryMetadata.
     * @exports ChannelCategoryMetadata
     * @classdesc Represents a ChannelCategoryMetadata.
     * @implements IChannelCategoryMetadata
     * @constructor
     * @param {IChannelCategoryMetadata=} [properties] Properties to set
     */
    function ChannelCategoryMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChannelCategoryMetadata name.
     * @member {string} name
     * @memberof ChannelCategoryMetadata
     * @instance
     */
    ChannelCategoryMetadata.prototype.name = "";

    /**
     * Creates a new ChannelCategoryMetadata instance using the specified properties.
     * @function create
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {IChannelCategoryMetadata=} [properties] Properties to set
     * @returns {ChannelCategoryMetadata} ChannelCategoryMetadata instance
     */
    ChannelCategoryMetadata.create = function create(properties) {
        return new ChannelCategoryMetadata(properties);
    };

    /**
     * Encodes the specified ChannelCategoryMetadata message. Does not implicitly {@link ChannelCategoryMetadata.verify|verify} messages.
     * @function encode
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {IChannelCategoryMetadata} message ChannelCategoryMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelCategoryMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        return writer;
    };

    /**
     * Encodes the specified ChannelCategoryMetadata message, length delimited. Does not implicitly {@link ChannelCategoryMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {IChannelCategoryMetadata} message ChannelCategoryMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelCategoryMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChannelCategoryMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ChannelCategoryMetadata} ChannelCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelCategoryMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ChannelCategoryMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ChannelCategoryMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ChannelCategoryMetadata} ChannelCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelCategoryMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChannelCategoryMetadata message.
     * @function verify
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChannelCategoryMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        return null;
    };

    /**
     * Creates a ChannelCategoryMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ChannelCategoryMetadata} ChannelCategoryMetadata
     */
    ChannelCategoryMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.ChannelCategoryMetadata)
            return object;
        var message = new $root.ChannelCategoryMetadata();
        if (object.name != null)
            message.name = String(object.name);
        return message;
    };

    /**
     * Creates a plain object from a ChannelCategoryMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ChannelCategoryMetadata
     * @static
     * @param {ChannelCategoryMetadata} message ChannelCategoryMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChannelCategoryMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.name = "";
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        return object;
    };

    /**
     * Converts this ChannelCategoryMetadata to JSON.
     * @function toJSON
     * @memberof ChannelCategoryMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChannelCategoryMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return ChannelCategoryMetadata;
})();

$root.CouncilCandidacyNoteMetadata = (function() {

    /**
     * Properties of a CouncilCandidacyNoteMetadata.
     * @exports ICouncilCandidacyNoteMetadata
     * @interface ICouncilCandidacyNoteMetadata
     * @property {string|null} [header] CouncilCandidacyNoteMetadata header
     * @property {Array.<string>|null} [bulletPoints] CouncilCandidacyNoteMetadata bulletPoints
     * @property {string|null} [bannerImageUri] CouncilCandidacyNoteMetadata bannerImageUri
     * @property {string|null} [description] CouncilCandidacyNoteMetadata description
     */

    /**
     * Constructs a new CouncilCandidacyNoteMetadata.
     * @exports CouncilCandidacyNoteMetadata
     * @classdesc Represents a CouncilCandidacyNoteMetadata.
     * @implements ICouncilCandidacyNoteMetadata
     * @constructor
     * @param {ICouncilCandidacyNoteMetadata=} [properties] Properties to set
     */
    function CouncilCandidacyNoteMetadata(properties) {
        this.bulletPoints = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CouncilCandidacyNoteMetadata header.
     * @member {string} header
     * @memberof CouncilCandidacyNoteMetadata
     * @instance
     */
    CouncilCandidacyNoteMetadata.prototype.header = "";

    /**
     * CouncilCandidacyNoteMetadata bulletPoints.
     * @member {Array.<string>} bulletPoints
     * @memberof CouncilCandidacyNoteMetadata
     * @instance
     */
    CouncilCandidacyNoteMetadata.prototype.bulletPoints = $util.emptyArray;

    /**
     * CouncilCandidacyNoteMetadata bannerImageUri.
     * @member {string} bannerImageUri
     * @memberof CouncilCandidacyNoteMetadata
     * @instance
     */
    CouncilCandidacyNoteMetadata.prototype.bannerImageUri = "";

    /**
     * CouncilCandidacyNoteMetadata description.
     * @member {string} description
     * @memberof CouncilCandidacyNoteMetadata
     * @instance
     */
    CouncilCandidacyNoteMetadata.prototype.description = "";

    /**
     * Creates a new CouncilCandidacyNoteMetadata instance using the specified properties.
     * @function create
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {ICouncilCandidacyNoteMetadata=} [properties] Properties to set
     * @returns {CouncilCandidacyNoteMetadata} CouncilCandidacyNoteMetadata instance
     */
    CouncilCandidacyNoteMetadata.create = function create(properties) {
        return new CouncilCandidacyNoteMetadata(properties);
    };

    /**
     * Encodes the specified CouncilCandidacyNoteMetadata message. Does not implicitly {@link CouncilCandidacyNoteMetadata.verify|verify} messages.
     * @function encode
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {ICouncilCandidacyNoteMetadata} message CouncilCandidacyNoteMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CouncilCandidacyNoteMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.header != null && Object.hasOwnProperty.call(message, "header"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.header);
        if (message.bulletPoints != null && message.bulletPoints.length)
            for (var i = 0; i < message.bulletPoints.length; ++i)
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.bulletPoints[i]);
        if (message.bannerImageUri != null && Object.hasOwnProperty.call(message, "bannerImageUri"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.bannerImageUri);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.description);
        return writer;
    };

    /**
     * Encodes the specified CouncilCandidacyNoteMetadata message, length delimited. Does not implicitly {@link CouncilCandidacyNoteMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {ICouncilCandidacyNoteMetadata} message CouncilCandidacyNoteMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CouncilCandidacyNoteMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CouncilCandidacyNoteMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CouncilCandidacyNoteMetadata} CouncilCandidacyNoteMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CouncilCandidacyNoteMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.CouncilCandidacyNoteMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.header = reader.string();
                break;
            case 2:
                if (!(message.bulletPoints && message.bulletPoints.length))
                    message.bulletPoints = [];
                message.bulletPoints.push(reader.string());
                break;
            case 3:
                message.bannerImageUri = reader.string();
                break;
            case 4:
                message.description = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CouncilCandidacyNoteMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CouncilCandidacyNoteMetadata} CouncilCandidacyNoteMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CouncilCandidacyNoteMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CouncilCandidacyNoteMetadata message.
     * @function verify
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CouncilCandidacyNoteMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.header != null && message.hasOwnProperty("header"))
            if (!$util.isString(message.header))
                return "header: string expected";
        if (message.bulletPoints != null && message.hasOwnProperty("bulletPoints")) {
            if (!Array.isArray(message.bulletPoints))
                return "bulletPoints: array expected";
            for (var i = 0; i < message.bulletPoints.length; ++i)
                if (!$util.isString(message.bulletPoints[i]))
                    return "bulletPoints: string[] expected";
        }
        if (message.bannerImageUri != null && message.hasOwnProperty("bannerImageUri"))
            if (!$util.isString(message.bannerImageUri))
                return "bannerImageUri: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        return null;
    };

    /**
     * Creates a CouncilCandidacyNoteMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CouncilCandidacyNoteMetadata} CouncilCandidacyNoteMetadata
     */
    CouncilCandidacyNoteMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.CouncilCandidacyNoteMetadata)
            return object;
        var message = new $root.CouncilCandidacyNoteMetadata();
        if (object.header != null)
            message.header = String(object.header);
        if (object.bulletPoints) {
            if (!Array.isArray(object.bulletPoints))
                throw TypeError(".CouncilCandidacyNoteMetadata.bulletPoints: array expected");
            message.bulletPoints = [];
            for (var i = 0; i < object.bulletPoints.length; ++i)
                message.bulletPoints[i] = String(object.bulletPoints[i]);
        }
        if (object.bannerImageUri != null)
            message.bannerImageUri = String(object.bannerImageUri);
        if (object.description != null)
            message.description = String(object.description);
        return message;
    };

    /**
     * Creates a plain object from a CouncilCandidacyNoteMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CouncilCandidacyNoteMetadata
     * @static
     * @param {CouncilCandidacyNoteMetadata} message CouncilCandidacyNoteMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CouncilCandidacyNoteMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.bulletPoints = [];
        if (options.defaults) {
            object.header = "";
            object.bannerImageUri = "";
            object.description = "";
        }
        if (message.header != null && message.hasOwnProperty("header"))
            object.header = message.header;
        if (message.bulletPoints && message.bulletPoints.length) {
            object.bulletPoints = [];
            for (var j = 0; j < message.bulletPoints.length; ++j)
                object.bulletPoints[j] = message.bulletPoints[j];
        }
        if (message.bannerImageUri != null && message.hasOwnProperty("bannerImageUri"))
            object.bannerImageUri = message.bannerImageUri;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        return object;
    };

    /**
     * Converts this CouncilCandidacyNoteMetadata to JSON.
     * @function toJSON
     * @memberof CouncilCandidacyNoteMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CouncilCandidacyNoteMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return CouncilCandidacyNoteMetadata;
})();

$root.ForumPostReaction = (function() {

    /**
     * Properties of a ForumPostReaction.
     * @exports IForumPostReaction
     * @interface IForumPostReaction
     */

    /**
     * Constructs a new ForumPostReaction.
     * @exports ForumPostReaction
     * @classdesc Represents a ForumPostReaction.
     * @implements IForumPostReaction
     * @constructor
     * @param {IForumPostReaction=} [properties] Properties to set
     */
    function ForumPostReaction(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Creates a new ForumPostReaction instance using the specified properties.
     * @function create
     * @memberof ForumPostReaction
     * @static
     * @param {IForumPostReaction=} [properties] Properties to set
     * @returns {ForumPostReaction} ForumPostReaction instance
     */
    ForumPostReaction.create = function create(properties) {
        return new ForumPostReaction(properties);
    };

    /**
     * Encodes the specified ForumPostReaction message. Does not implicitly {@link ForumPostReaction.verify|verify} messages.
     * @function encode
     * @memberof ForumPostReaction
     * @static
     * @param {IForumPostReaction} message ForumPostReaction message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ForumPostReaction.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        return writer;
    };

    /**
     * Encodes the specified ForumPostReaction message, length delimited. Does not implicitly {@link ForumPostReaction.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ForumPostReaction
     * @static
     * @param {IForumPostReaction} message ForumPostReaction message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ForumPostReaction.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ForumPostReaction message from the specified reader or buffer.
     * @function decode
     * @memberof ForumPostReaction
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ForumPostReaction} ForumPostReaction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ForumPostReaction.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ForumPostReaction();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ForumPostReaction message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ForumPostReaction
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ForumPostReaction} ForumPostReaction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ForumPostReaction.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ForumPostReaction message.
     * @function verify
     * @memberof ForumPostReaction
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ForumPostReaction.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        return null;
    };

    /**
     * Creates a ForumPostReaction message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ForumPostReaction
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ForumPostReaction} ForumPostReaction
     */
    ForumPostReaction.fromObject = function fromObject(object) {
        if (object instanceof $root.ForumPostReaction)
            return object;
        return new $root.ForumPostReaction();
    };

    /**
     * Creates a plain object from a ForumPostReaction message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ForumPostReaction
     * @static
     * @param {ForumPostReaction} message ForumPostReaction
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ForumPostReaction.toObject = function toObject() {
        return {};
    };

    /**
     * Converts this ForumPostReaction to JSON.
     * @function toJSON
     * @memberof ForumPostReaction
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ForumPostReaction.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Reaction enum.
     * @name ForumPostReaction.Reaction
     * @enum {number}
     * @property {number} CANCEL=0 CANCEL value
     * @property {number} LIKE=1 LIKE value
     */
    ForumPostReaction.Reaction = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "CANCEL"] = 0;
        values[valuesById[1] = "LIKE"] = 1;
        return values;
    })();

    return ForumPostReaction;
})();

$root.ForumPostMetadata = (function() {

    /**
     * Properties of a ForumPostMetadata.
     * @exports IForumPostMetadata
     * @interface IForumPostMetadata
     * @property {string|null} [text] ForumPostMetadata text
     * @property {number|null} [repliesTo] ForumPostMetadata repliesTo
     */

    /**
     * Constructs a new ForumPostMetadata.
     * @exports ForumPostMetadata
     * @classdesc Represents a ForumPostMetadata.
     * @implements IForumPostMetadata
     * @constructor
     * @param {IForumPostMetadata=} [properties] Properties to set
     */
    function ForumPostMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ForumPostMetadata text.
     * @member {string} text
     * @memberof ForumPostMetadata
     * @instance
     */
    ForumPostMetadata.prototype.text = "";

    /**
     * ForumPostMetadata repliesTo.
     * @member {number} repliesTo
     * @memberof ForumPostMetadata
     * @instance
     */
    ForumPostMetadata.prototype.repliesTo = 0;

    /**
     * Creates a new ForumPostMetadata instance using the specified properties.
     * @function create
     * @memberof ForumPostMetadata
     * @static
     * @param {IForumPostMetadata=} [properties] Properties to set
     * @returns {ForumPostMetadata} ForumPostMetadata instance
     */
    ForumPostMetadata.create = function create(properties) {
        return new ForumPostMetadata(properties);
    };

    /**
     * Encodes the specified ForumPostMetadata message. Does not implicitly {@link ForumPostMetadata.verify|verify} messages.
     * @function encode
     * @memberof ForumPostMetadata
     * @static
     * @param {IForumPostMetadata} message ForumPostMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ForumPostMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.text != null && Object.hasOwnProperty.call(message, "text"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.text);
        if (message.repliesTo != null && Object.hasOwnProperty.call(message, "repliesTo"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.repliesTo);
        return writer;
    };

    /**
     * Encodes the specified ForumPostMetadata message, length delimited. Does not implicitly {@link ForumPostMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ForumPostMetadata
     * @static
     * @param {IForumPostMetadata} message ForumPostMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ForumPostMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ForumPostMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof ForumPostMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ForumPostMetadata} ForumPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ForumPostMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ForumPostMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.text = reader.string();
                break;
            case 2:
                message.repliesTo = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ForumPostMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ForumPostMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ForumPostMetadata} ForumPostMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ForumPostMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ForumPostMetadata message.
     * @function verify
     * @memberof ForumPostMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ForumPostMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.text != null && message.hasOwnProperty("text"))
            if (!$util.isString(message.text))
                return "text: string expected";
        if (message.repliesTo != null && message.hasOwnProperty("repliesTo"))
            if (!$util.isInteger(message.repliesTo))
                return "repliesTo: integer expected";
        return null;
    };

    /**
     * Creates a ForumPostMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ForumPostMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ForumPostMetadata} ForumPostMetadata
     */
    ForumPostMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.ForumPostMetadata)
            return object;
        var message = new $root.ForumPostMetadata();
        if (object.text != null)
            message.text = String(object.text);
        if (object.repliesTo != null)
            message.repliesTo = object.repliesTo >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a ForumPostMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ForumPostMetadata
     * @static
     * @param {ForumPostMetadata} message ForumPostMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ForumPostMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.text = "";
            object.repliesTo = 0;
        }
        if (message.text != null && message.hasOwnProperty("text"))
            object.text = message.text;
        if (message.repliesTo != null && message.hasOwnProperty("repliesTo"))
            object.repliesTo = message.repliesTo;
        return object;
    };

    /**
     * Converts this ForumPostMetadata to JSON.
     * @function toJSON
     * @memberof ForumPostMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ForumPostMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return ForumPostMetadata;
})();

$root.MembershipMetadata = (function() {

    /**
     * Properties of a MembershipMetadata.
     * @exports IMembershipMetadata
     * @interface IMembershipMetadata
     * @property {string|null} [name] MembershipMetadata name
     * @property {number|null} [avatar] MembershipMetadata avatar
     * @property {string|null} [about] MembershipMetadata about
     */

    /**
     * Constructs a new MembershipMetadata.
     * @exports MembershipMetadata
     * @classdesc Represents a MembershipMetadata.
     * @implements IMembershipMetadata
     * @constructor
     * @param {IMembershipMetadata=} [properties] Properties to set
     */
    function MembershipMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * MembershipMetadata name.
     * @member {string} name
     * @memberof MembershipMetadata
     * @instance
     */
    MembershipMetadata.prototype.name = "";

    /**
     * MembershipMetadata avatar.
     * @member {number} avatar
     * @memberof MembershipMetadata
     * @instance
     */
    MembershipMetadata.prototype.avatar = 0;

    /**
     * MembershipMetadata about.
     * @member {string} about
     * @memberof MembershipMetadata
     * @instance
     */
    MembershipMetadata.prototype.about = "";

    /**
     * Creates a new MembershipMetadata instance using the specified properties.
     * @function create
     * @memberof MembershipMetadata
     * @static
     * @param {IMembershipMetadata=} [properties] Properties to set
     * @returns {MembershipMetadata} MembershipMetadata instance
     */
    MembershipMetadata.create = function create(properties) {
        return new MembershipMetadata(properties);
    };

    /**
     * Encodes the specified MembershipMetadata message. Does not implicitly {@link MembershipMetadata.verify|verify} messages.
     * @function encode
     * @memberof MembershipMetadata
     * @static
     * @param {IMembershipMetadata} message MembershipMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MembershipMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.avatar != null && Object.hasOwnProperty.call(message, "avatar"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.avatar);
        if (message.about != null && Object.hasOwnProperty.call(message, "about"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.about);
        return writer;
    };

    /**
     * Encodes the specified MembershipMetadata message, length delimited. Does not implicitly {@link MembershipMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MembershipMetadata
     * @static
     * @param {IMembershipMetadata} message MembershipMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MembershipMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MembershipMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof MembershipMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MembershipMetadata} MembershipMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MembershipMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.MembershipMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                message.avatar = reader.uint32();
                break;
            case 3:
                message.about = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a MembershipMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MembershipMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MembershipMetadata} MembershipMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MembershipMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MembershipMetadata message.
     * @function verify
     * @memberof MembershipMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MembershipMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.avatar != null && message.hasOwnProperty("avatar"))
            if (!$util.isInteger(message.avatar))
                return "avatar: integer expected";
        if (message.about != null && message.hasOwnProperty("about"))
            if (!$util.isString(message.about))
                return "about: string expected";
        return null;
    };

    /**
     * Creates a MembershipMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MembershipMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MembershipMetadata} MembershipMetadata
     */
    MembershipMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.MembershipMetadata)
            return object;
        var message = new $root.MembershipMetadata();
        if (object.name != null)
            message.name = String(object.name);
        if (object.avatar != null)
            message.avatar = object.avatar >>> 0;
        if (object.about != null)
            message.about = String(object.about);
        return message;
    };

    /**
     * Creates a plain object from a MembershipMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MembershipMetadata
     * @static
     * @param {MembershipMetadata} message MembershipMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MembershipMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.name = "";
            object.avatar = 0;
            object.about = "";
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.avatar != null && message.hasOwnProperty("avatar"))
            object.avatar = message.avatar;
        if (message.about != null && message.hasOwnProperty("about"))
            object.about = message.about;
        return object;
    };

    /**
     * Converts this MembershipMetadata to JSON.
     * @function toJSON
     * @memberof MembershipMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MembershipMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return MembershipMetadata;
})();

$root.PersonMetadata = (function() {

    /**
     * Properties of a PersonMetadata.
     * @exports IPersonMetadata
     * @interface IPersonMetadata
     * @property {string|null} [firstName] PersonMetadata firstName
     * @property {string|null} [middleName] PersonMetadata middleName
     * @property {string|null} [lastName] PersonMetadata lastName
     * @property {string|null} [about] PersonMetadata about
     * @property {number|null} [coverPhoto] PersonMetadata coverPhoto
     * @property {number|null} [avatarPhoto] PersonMetadata avatarPhoto
     */

    /**
     * Constructs a new PersonMetadata.
     * @exports PersonMetadata
     * @classdesc Represents a PersonMetadata.
     * @implements IPersonMetadata
     * @constructor
     * @param {IPersonMetadata=} [properties] Properties to set
     */
    function PersonMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PersonMetadata firstName.
     * @member {string} firstName
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.firstName = "";

    /**
     * PersonMetadata middleName.
     * @member {string} middleName
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.middleName = "";

    /**
     * PersonMetadata lastName.
     * @member {string} lastName
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.lastName = "";

    /**
     * PersonMetadata about.
     * @member {string} about
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.about = "";

    /**
     * PersonMetadata coverPhoto.
     * @member {number} coverPhoto
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.coverPhoto = 0;

    /**
     * PersonMetadata avatarPhoto.
     * @member {number} avatarPhoto
     * @memberof PersonMetadata
     * @instance
     */
    PersonMetadata.prototype.avatarPhoto = 0;

    /**
     * Creates a new PersonMetadata instance using the specified properties.
     * @function create
     * @memberof PersonMetadata
     * @static
     * @param {IPersonMetadata=} [properties] Properties to set
     * @returns {PersonMetadata} PersonMetadata instance
     */
    PersonMetadata.create = function create(properties) {
        return new PersonMetadata(properties);
    };

    /**
     * Encodes the specified PersonMetadata message. Does not implicitly {@link PersonMetadata.verify|verify} messages.
     * @function encode
     * @memberof PersonMetadata
     * @static
     * @param {IPersonMetadata} message PersonMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PersonMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.firstName != null && Object.hasOwnProperty.call(message, "firstName"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.firstName);
        if (message.middleName != null && Object.hasOwnProperty.call(message, "middleName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.middleName);
        if (message.lastName != null && Object.hasOwnProperty.call(message, "lastName"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.lastName);
        if (message.about != null && Object.hasOwnProperty.call(message, "about"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.about);
        if (message.coverPhoto != null && Object.hasOwnProperty.call(message, "coverPhoto"))
            writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.coverPhoto);
        if (message.avatarPhoto != null && Object.hasOwnProperty.call(message, "avatarPhoto"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.avatarPhoto);
        return writer;
    };

    /**
     * Encodes the specified PersonMetadata message, length delimited. Does not implicitly {@link PersonMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PersonMetadata
     * @static
     * @param {IPersonMetadata} message PersonMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PersonMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PersonMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof PersonMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PersonMetadata} PersonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PersonMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.PersonMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.firstName = reader.string();
                break;
            case 2:
                message.middleName = reader.string();
                break;
            case 3:
                message.lastName = reader.string();
                break;
            case 4:
                message.about = reader.string();
                break;
            case 5:
                message.coverPhoto = reader.uint32();
                break;
            case 6:
                message.avatarPhoto = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a PersonMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PersonMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PersonMetadata} PersonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PersonMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PersonMetadata message.
     * @function verify
     * @memberof PersonMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PersonMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.firstName != null && message.hasOwnProperty("firstName"))
            if (!$util.isString(message.firstName))
                return "firstName: string expected";
        if (message.middleName != null && message.hasOwnProperty("middleName"))
            if (!$util.isString(message.middleName))
                return "middleName: string expected";
        if (message.lastName != null && message.hasOwnProperty("lastName"))
            if (!$util.isString(message.lastName))
                return "lastName: string expected";
        if (message.about != null && message.hasOwnProperty("about"))
            if (!$util.isString(message.about))
                return "about: string expected";
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            if (!$util.isInteger(message.coverPhoto))
                return "coverPhoto: integer expected";
        if (message.avatarPhoto != null && message.hasOwnProperty("avatarPhoto"))
            if (!$util.isInteger(message.avatarPhoto))
                return "avatarPhoto: integer expected";
        return null;
    };

    /**
     * Creates a PersonMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PersonMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PersonMetadata} PersonMetadata
     */
    PersonMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.PersonMetadata)
            return object;
        var message = new $root.PersonMetadata();
        if (object.firstName != null)
            message.firstName = String(object.firstName);
        if (object.middleName != null)
            message.middleName = String(object.middleName);
        if (object.lastName != null)
            message.lastName = String(object.lastName);
        if (object.about != null)
            message.about = String(object.about);
        if (object.coverPhoto != null)
            message.coverPhoto = object.coverPhoto >>> 0;
        if (object.avatarPhoto != null)
            message.avatarPhoto = object.avatarPhoto >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a PersonMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PersonMetadata
     * @static
     * @param {PersonMetadata} message PersonMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PersonMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.firstName = "";
            object.middleName = "";
            object.lastName = "";
            object.about = "";
            object.coverPhoto = 0;
            object.avatarPhoto = 0;
        }
        if (message.firstName != null && message.hasOwnProperty("firstName"))
            object.firstName = message.firstName;
        if (message.middleName != null && message.hasOwnProperty("middleName"))
            object.middleName = message.middleName;
        if (message.lastName != null && message.hasOwnProperty("lastName"))
            object.lastName = message.lastName;
        if (message.about != null && message.hasOwnProperty("about"))
            object.about = message.about;
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            object.coverPhoto = message.coverPhoto;
        if (message.avatarPhoto != null && message.hasOwnProperty("avatarPhoto"))
            object.avatarPhoto = message.avatarPhoto;
        return object;
    };

    /**
     * Converts this PersonMetadata to JSON.
     * @function toJSON
     * @memberof PersonMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PersonMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return PersonMetadata;
})();

$root.PlaylistMetadata = (function() {

    /**
     * Properties of a PlaylistMetadata.
     * @exports IPlaylistMetadata
     * @interface IPlaylistMetadata
     * @property {string|null} [title] PlaylistMetadata title
     * @property {Array.<Long>|null} [videos] PlaylistMetadata videos
     */

    /**
     * Constructs a new PlaylistMetadata.
     * @exports PlaylistMetadata
     * @classdesc Represents a PlaylistMetadata.
     * @implements IPlaylistMetadata
     * @constructor
     * @param {IPlaylistMetadata=} [properties] Properties to set
     */
    function PlaylistMetadata(properties) {
        this.videos = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PlaylistMetadata title.
     * @member {string} title
     * @memberof PlaylistMetadata
     * @instance
     */
    PlaylistMetadata.prototype.title = "";

    /**
     * PlaylistMetadata videos.
     * @member {Array.<Long>} videos
     * @memberof PlaylistMetadata
     * @instance
     */
    PlaylistMetadata.prototype.videos = $util.emptyArray;

    /**
     * Creates a new PlaylistMetadata instance using the specified properties.
     * @function create
     * @memberof PlaylistMetadata
     * @static
     * @param {IPlaylistMetadata=} [properties] Properties to set
     * @returns {PlaylistMetadata} PlaylistMetadata instance
     */
    PlaylistMetadata.create = function create(properties) {
        return new PlaylistMetadata(properties);
    };

    /**
     * Encodes the specified PlaylistMetadata message. Does not implicitly {@link PlaylistMetadata.verify|verify} messages.
     * @function encode
     * @memberof PlaylistMetadata
     * @static
     * @param {IPlaylistMetadata} message PlaylistMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PlaylistMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.title);
        if (message.videos != null && message.videos.length)
            for (var i = 0; i < message.videos.length; ++i)
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.videos[i]);
        return writer;
    };

    /**
     * Encodes the specified PlaylistMetadata message, length delimited. Does not implicitly {@link PlaylistMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PlaylistMetadata
     * @static
     * @param {IPlaylistMetadata} message PlaylistMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PlaylistMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PlaylistMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof PlaylistMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PlaylistMetadata} PlaylistMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PlaylistMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.PlaylistMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.title = reader.string();
                break;
            case 2:
                if (!(message.videos && message.videos.length))
                    message.videos = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.videos.push(reader.uint64());
                } else
                    message.videos.push(reader.uint64());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a PlaylistMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PlaylistMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PlaylistMetadata} PlaylistMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PlaylistMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PlaylistMetadata message.
     * @function verify
     * @memberof PlaylistMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PlaylistMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.videos != null && message.hasOwnProperty("videos")) {
            if (!Array.isArray(message.videos))
                return "videos: array expected";
            for (var i = 0; i < message.videos.length; ++i)
                if (!$util.isInteger(message.videos[i]) && !(message.videos[i] && $util.isInteger(message.videos[i].low) && $util.isInteger(message.videos[i].high)))
                    return "videos: integer|Long[] expected";
        }
        return null;
    };

    /**
     * Creates a PlaylistMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PlaylistMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PlaylistMetadata} PlaylistMetadata
     */
    PlaylistMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.PlaylistMetadata)
            return object;
        var message = new $root.PlaylistMetadata();
        if (object.title != null)
            message.title = String(object.title);
        if (object.videos) {
            if (!Array.isArray(object.videos))
                throw TypeError(".PlaylistMetadata.videos: array expected");
            message.videos = [];
            for (var i = 0; i < object.videos.length; ++i)
                if ($util.Long)
                    (message.videos[i] = $util.Long.fromValue(object.videos[i])).unsigned = true;
                else if (typeof object.videos[i] === "string")
                    message.videos[i] = parseInt(object.videos[i], 10);
                else if (typeof object.videos[i] === "number")
                    message.videos[i] = object.videos[i];
                else if (typeof object.videos[i] === "object")
                    message.videos[i] = new $util.LongBits(object.videos[i].low >>> 0, object.videos[i].high >>> 0).toNumber(true);
        }
        return message;
    };

    /**
     * Creates a plain object from a PlaylistMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PlaylistMetadata
     * @static
     * @param {PlaylistMetadata} message PlaylistMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PlaylistMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.videos = [];
        if (options.defaults)
            object.title = "";
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.videos && message.videos.length) {
            object.videos = [];
            for (var j = 0; j < message.videos.length; ++j)
                if (typeof message.videos[j] === "number")
                    object.videos[j] = options.longs === String ? String(message.videos[j]) : message.videos[j];
                else
                    object.videos[j] = options.longs === String ? $util.Long.prototype.toString.call(message.videos[j]) : options.longs === Number ? new $util.LongBits(message.videos[j].low >>> 0, message.videos[j].high >>> 0).toNumber(true) : message.videos[j];
        }
        return object;
    };

    /**
     * Converts this PlaylistMetadata to JSON.
     * @function toJSON
     * @memberof PlaylistMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PlaylistMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return PlaylistMetadata;
})();

$root.SeriesMetadata = (function() {

    /**
     * Properties of a SeriesMetadata.
     * @exports ISeriesMetadata
     * @interface ISeriesMetadata
     * @property {string|null} [title] SeriesMetadata title
     * @property {string|null} [description] SeriesMetadata description
     * @property {number|null} [coverPhoto] SeriesMetadata coverPhoto
     * @property {Array.<Long>|null} [persons] SeriesMetadata persons
     */

    /**
     * Constructs a new SeriesMetadata.
     * @exports SeriesMetadata
     * @classdesc Represents a SeriesMetadata.
     * @implements ISeriesMetadata
     * @constructor
     * @param {ISeriesMetadata=} [properties] Properties to set
     */
    function SeriesMetadata(properties) {
        this.persons = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SeriesMetadata title.
     * @member {string} title
     * @memberof SeriesMetadata
     * @instance
     */
    SeriesMetadata.prototype.title = "";

    /**
     * SeriesMetadata description.
     * @member {string} description
     * @memberof SeriesMetadata
     * @instance
     */
    SeriesMetadata.prototype.description = "";

    /**
     * SeriesMetadata coverPhoto.
     * @member {number} coverPhoto
     * @memberof SeriesMetadata
     * @instance
     */
    SeriesMetadata.prototype.coverPhoto = 0;

    /**
     * SeriesMetadata persons.
     * @member {Array.<Long>} persons
     * @memberof SeriesMetadata
     * @instance
     */
    SeriesMetadata.prototype.persons = $util.emptyArray;

    /**
     * Creates a new SeriesMetadata instance using the specified properties.
     * @function create
     * @memberof SeriesMetadata
     * @static
     * @param {ISeriesMetadata=} [properties] Properties to set
     * @returns {SeriesMetadata} SeriesMetadata instance
     */
    SeriesMetadata.create = function create(properties) {
        return new SeriesMetadata(properties);
    };

    /**
     * Encodes the specified SeriesMetadata message. Does not implicitly {@link SeriesMetadata.verify|verify} messages.
     * @function encode
     * @memberof SeriesMetadata
     * @static
     * @param {ISeriesMetadata} message SeriesMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SeriesMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.title);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.coverPhoto != null && Object.hasOwnProperty.call(message, "coverPhoto"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.coverPhoto);
        if (message.persons != null && message.persons.length) {
            writer.uint32(/* id 4, wireType 2 =*/34).fork();
            for (var i = 0; i < message.persons.length; ++i)
                writer.uint64(message.persons[i]);
            writer.ldelim();
        }
        return writer;
    };

    /**
     * Encodes the specified SeriesMetadata message, length delimited. Does not implicitly {@link SeriesMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SeriesMetadata
     * @static
     * @param {ISeriesMetadata} message SeriesMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SeriesMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SeriesMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof SeriesMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SeriesMetadata} SeriesMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SeriesMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SeriesMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.title = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.coverPhoto = reader.uint32();
                break;
            case 4:
                if (!(message.persons && message.persons.length))
                    message.persons = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.persons.push(reader.uint64());
                } else
                    message.persons.push(reader.uint64());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SeriesMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SeriesMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SeriesMetadata} SeriesMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SeriesMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SeriesMetadata message.
     * @function verify
     * @memberof SeriesMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SeriesMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            if (!$util.isInteger(message.coverPhoto))
                return "coverPhoto: integer expected";
        if (message.persons != null && message.hasOwnProperty("persons")) {
            if (!Array.isArray(message.persons))
                return "persons: array expected";
            for (var i = 0; i < message.persons.length; ++i)
                if (!$util.isInteger(message.persons[i]) && !(message.persons[i] && $util.isInteger(message.persons[i].low) && $util.isInteger(message.persons[i].high)))
                    return "persons: integer|Long[] expected";
        }
        return null;
    };

    /**
     * Creates a SeriesMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SeriesMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SeriesMetadata} SeriesMetadata
     */
    SeriesMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.SeriesMetadata)
            return object;
        var message = new $root.SeriesMetadata();
        if (object.title != null)
            message.title = String(object.title);
        if (object.description != null)
            message.description = String(object.description);
        if (object.coverPhoto != null)
            message.coverPhoto = object.coverPhoto >>> 0;
        if (object.persons) {
            if (!Array.isArray(object.persons))
                throw TypeError(".SeriesMetadata.persons: array expected");
            message.persons = [];
            for (var i = 0; i < object.persons.length; ++i)
                if ($util.Long)
                    (message.persons[i] = $util.Long.fromValue(object.persons[i])).unsigned = true;
                else if (typeof object.persons[i] === "string")
                    message.persons[i] = parseInt(object.persons[i], 10);
                else if (typeof object.persons[i] === "number")
                    message.persons[i] = object.persons[i];
                else if (typeof object.persons[i] === "object")
                    message.persons[i] = new $util.LongBits(object.persons[i].low >>> 0, object.persons[i].high >>> 0).toNumber(true);
        }
        return message;
    };

    /**
     * Creates a plain object from a SeriesMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SeriesMetadata
     * @static
     * @param {SeriesMetadata} message SeriesMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SeriesMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.persons = [];
        if (options.defaults) {
            object.title = "";
            object.description = "";
            object.coverPhoto = 0;
        }
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            object.coverPhoto = message.coverPhoto;
        if (message.persons && message.persons.length) {
            object.persons = [];
            for (var j = 0; j < message.persons.length; ++j)
                if (typeof message.persons[j] === "number")
                    object.persons[j] = options.longs === String ? String(message.persons[j]) : message.persons[j];
                else
                    object.persons[j] = options.longs === String ? $util.Long.prototype.toString.call(message.persons[j]) : options.longs === Number ? new $util.LongBits(message.persons[j].low >>> 0, message.persons[j].high >>> 0).toNumber(true) : message.persons[j];
        }
        return object;
    };

    /**
     * Converts this SeriesMetadata to JSON.
     * @function toJSON
     * @memberof SeriesMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SeriesMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SeriesMetadata;
})();

$root.SeasonMetadata = (function() {

    /**
     * Properties of a SeasonMetadata.
     * @exports ISeasonMetadata
     * @interface ISeasonMetadata
     * @property {string|null} [title] SeasonMetadata title
     * @property {string|null} [description] SeasonMetadata description
     * @property {number|null} [coverPhoto] SeasonMetadata coverPhoto
     * @property {Array.<Long>|null} [persons] SeasonMetadata persons
     */

    /**
     * Constructs a new SeasonMetadata.
     * @exports SeasonMetadata
     * @classdesc Represents a SeasonMetadata.
     * @implements ISeasonMetadata
     * @constructor
     * @param {ISeasonMetadata=} [properties] Properties to set
     */
    function SeasonMetadata(properties) {
        this.persons = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SeasonMetadata title.
     * @member {string} title
     * @memberof SeasonMetadata
     * @instance
     */
    SeasonMetadata.prototype.title = "";

    /**
     * SeasonMetadata description.
     * @member {string} description
     * @memberof SeasonMetadata
     * @instance
     */
    SeasonMetadata.prototype.description = "";

    /**
     * SeasonMetadata coverPhoto.
     * @member {number} coverPhoto
     * @memberof SeasonMetadata
     * @instance
     */
    SeasonMetadata.prototype.coverPhoto = 0;

    /**
     * SeasonMetadata persons.
     * @member {Array.<Long>} persons
     * @memberof SeasonMetadata
     * @instance
     */
    SeasonMetadata.prototype.persons = $util.emptyArray;

    /**
     * Creates a new SeasonMetadata instance using the specified properties.
     * @function create
     * @memberof SeasonMetadata
     * @static
     * @param {ISeasonMetadata=} [properties] Properties to set
     * @returns {SeasonMetadata} SeasonMetadata instance
     */
    SeasonMetadata.create = function create(properties) {
        return new SeasonMetadata(properties);
    };

    /**
     * Encodes the specified SeasonMetadata message. Does not implicitly {@link SeasonMetadata.verify|verify} messages.
     * @function encode
     * @memberof SeasonMetadata
     * @static
     * @param {ISeasonMetadata} message SeasonMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SeasonMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.title);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.coverPhoto != null && Object.hasOwnProperty.call(message, "coverPhoto"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.coverPhoto);
        if (message.persons != null && message.persons.length) {
            writer.uint32(/* id 4, wireType 2 =*/34).fork();
            for (var i = 0; i < message.persons.length; ++i)
                writer.uint64(message.persons[i]);
            writer.ldelim();
        }
        return writer;
    };

    /**
     * Encodes the specified SeasonMetadata message, length delimited. Does not implicitly {@link SeasonMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SeasonMetadata
     * @static
     * @param {ISeasonMetadata} message SeasonMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SeasonMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SeasonMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof SeasonMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SeasonMetadata} SeasonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SeasonMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SeasonMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.title = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.coverPhoto = reader.uint32();
                break;
            case 4:
                if (!(message.persons && message.persons.length))
                    message.persons = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.persons.push(reader.uint64());
                } else
                    message.persons.push(reader.uint64());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SeasonMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SeasonMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SeasonMetadata} SeasonMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SeasonMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SeasonMetadata message.
     * @function verify
     * @memberof SeasonMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SeasonMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            if (!$util.isInteger(message.coverPhoto))
                return "coverPhoto: integer expected";
        if (message.persons != null && message.hasOwnProperty("persons")) {
            if (!Array.isArray(message.persons))
                return "persons: array expected";
            for (var i = 0; i < message.persons.length; ++i)
                if (!$util.isInteger(message.persons[i]) && !(message.persons[i] && $util.isInteger(message.persons[i].low) && $util.isInteger(message.persons[i].high)))
                    return "persons: integer|Long[] expected";
        }
        return null;
    };

    /**
     * Creates a SeasonMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SeasonMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SeasonMetadata} SeasonMetadata
     */
    SeasonMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.SeasonMetadata)
            return object;
        var message = new $root.SeasonMetadata();
        if (object.title != null)
            message.title = String(object.title);
        if (object.description != null)
            message.description = String(object.description);
        if (object.coverPhoto != null)
            message.coverPhoto = object.coverPhoto >>> 0;
        if (object.persons) {
            if (!Array.isArray(object.persons))
                throw TypeError(".SeasonMetadata.persons: array expected");
            message.persons = [];
            for (var i = 0; i < object.persons.length; ++i)
                if ($util.Long)
                    (message.persons[i] = $util.Long.fromValue(object.persons[i])).unsigned = true;
                else if (typeof object.persons[i] === "string")
                    message.persons[i] = parseInt(object.persons[i], 10);
                else if (typeof object.persons[i] === "number")
                    message.persons[i] = object.persons[i];
                else if (typeof object.persons[i] === "object")
                    message.persons[i] = new $util.LongBits(object.persons[i].low >>> 0, object.persons[i].high >>> 0).toNumber(true);
        }
        return message;
    };

    /**
     * Creates a plain object from a SeasonMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SeasonMetadata
     * @static
     * @param {SeasonMetadata} message SeasonMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SeasonMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.persons = [];
        if (options.defaults) {
            object.title = "";
            object.description = "";
            object.coverPhoto = 0;
        }
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.coverPhoto != null && message.hasOwnProperty("coverPhoto"))
            object.coverPhoto = message.coverPhoto;
        if (message.persons && message.persons.length) {
            object.persons = [];
            for (var j = 0; j < message.persons.length; ++j)
                if (typeof message.persons[j] === "number")
                    object.persons[j] = options.longs === String ? String(message.persons[j]) : message.persons[j];
                else
                    object.persons[j] = options.longs === String ? $util.Long.prototype.toString.call(message.persons[j]) : options.longs === Number ? new $util.LongBits(message.persons[j].low >>> 0, message.persons[j].high >>> 0).toNumber(true) : message.persons[j];
        }
        return object;
    };

    /**
     * Converts this SeasonMetadata to JSON.
     * @function toJSON
     * @memberof SeasonMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SeasonMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SeasonMetadata;
})();

$root.PublishedBeforeJoystream = (function() {

    /**
     * Properties of a PublishedBeforeJoystream.
     * @exports IPublishedBeforeJoystream
     * @interface IPublishedBeforeJoystream
     * @property {boolean|null} [isPublished] PublishedBeforeJoystream isPublished
     * @property {string|null} [date] PublishedBeforeJoystream date
     */

    /**
     * Constructs a new PublishedBeforeJoystream.
     * @exports PublishedBeforeJoystream
     * @classdesc Represents a PublishedBeforeJoystream.
     * @implements IPublishedBeforeJoystream
     * @constructor
     * @param {IPublishedBeforeJoystream=} [properties] Properties to set
     */
    function PublishedBeforeJoystream(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PublishedBeforeJoystream isPublished.
     * @member {boolean} isPublished
     * @memberof PublishedBeforeJoystream
     * @instance
     */
    PublishedBeforeJoystream.prototype.isPublished = false;

    /**
     * PublishedBeforeJoystream date.
     * @member {string} date
     * @memberof PublishedBeforeJoystream
     * @instance
     */
    PublishedBeforeJoystream.prototype.date = "";

    /**
     * Creates a new PublishedBeforeJoystream instance using the specified properties.
     * @function create
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {IPublishedBeforeJoystream=} [properties] Properties to set
     * @returns {PublishedBeforeJoystream} PublishedBeforeJoystream instance
     */
    PublishedBeforeJoystream.create = function create(properties) {
        return new PublishedBeforeJoystream(properties);
    };

    /**
     * Encodes the specified PublishedBeforeJoystream message. Does not implicitly {@link PublishedBeforeJoystream.verify|verify} messages.
     * @function encode
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {IPublishedBeforeJoystream} message PublishedBeforeJoystream message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PublishedBeforeJoystream.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.isPublished != null && Object.hasOwnProperty.call(message, "isPublished"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.isPublished);
        if (message.date != null && Object.hasOwnProperty.call(message, "date"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.date);
        return writer;
    };

    /**
     * Encodes the specified PublishedBeforeJoystream message, length delimited. Does not implicitly {@link PublishedBeforeJoystream.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {IPublishedBeforeJoystream} message PublishedBeforeJoystream message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PublishedBeforeJoystream.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PublishedBeforeJoystream message from the specified reader or buffer.
     * @function decode
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PublishedBeforeJoystream} PublishedBeforeJoystream
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PublishedBeforeJoystream.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.PublishedBeforeJoystream();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.isPublished = reader.bool();
                break;
            case 2:
                message.date = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a PublishedBeforeJoystream message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PublishedBeforeJoystream} PublishedBeforeJoystream
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PublishedBeforeJoystream.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PublishedBeforeJoystream message.
     * @function verify
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PublishedBeforeJoystream.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.isPublished != null && message.hasOwnProperty("isPublished"))
            if (typeof message.isPublished !== "boolean")
                return "isPublished: boolean expected";
        if (message.date != null && message.hasOwnProperty("date"))
            if (!$util.isString(message.date))
                return "date: string expected";
        return null;
    };

    /**
     * Creates a PublishedBeforeJoystream message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PublishedBeforeJoystream} PublishedBeforeJoystream
     */
    PublishedBeforeJoystream.fromObject = function fromObject(object) {
        if (object instanceof $root.PublishedBeforeJoystream)
            return object;
        var message = new $root.PublishedBeforeJoystream();
        if (object.isPublished != null)
            message.isPublished = Boolean(object.isPublished);
        if (object.date != null)
            message.date = String(object.date);
        return message;
    };

    /**
     * Creates a plain object from a PublishedBeforeJoystream message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PublishedBeforeJoystream
     * @static
     * @param {PublishedBeforeJoystream} message PublishedBeforeJoystream
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PublishedBeforeJoystream.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.isPublished = false;
            object.date = "";
        }
        if (message.isPublished != null && message.hasOwnProperty("isPublished"))
            object.isPublished = message.isPublished;
        if (message.date != null && message.hasOwnProperty("date"))
            object.date = message.date;
        return object;
    };

    /**
     * Converts this PublishedBeforeJoystream to JSON.
     * @function toJSON
     * @memberof PublishedBeforeJoystream
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PublishedBeforeJoystream.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return PublishedBeforeJoystream;
})();

$root.License = (function() {

    /**
     * Properties of a License.
     * @exports ILicense
     * @interface ILicense
     * @property {number|null} [code] License code
     * @property {string|null} [attribution] License attribution
     * @property {string|null} [customText] License customText
     */

    /**
     * Constructs a new License.
     * @exports License
     * @classdesc Represents a License.
     * @implements ILicense
     * @constructor
     * @param {ILicense=} [properties] Properties to set
     */
    function License(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * License code.
     * @member {number} code
     * @memberof License
     * @instance
     */
    License.prototype.code = 0;

    /**
     * License attribution.
     * @member {string} attribution
     * @memberof License
     * @instance
     */
    License.prototype.attribution = "";

    /**
     * License customText.
     * @member {string} customText
     * @memberof License
     * @instance
     */
    License.prototype.customText = "";

    /**
     * Creates a new License instance using the specified properties.
     * @function create
     * @memberof License
     * @static
     * @param {ILicense=} [properties] Properties to set
     * @returns {License} License instance
     */
    License.create = function create(properties) {
        return new License(properties);
    };

    /**
     * Encodes the specified License message. Does not implicitly {@link License.verify|verify} messages.
     * @function encode
     * @memberof License
     * @static
     * @param {ILicense} message License message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    License.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.code != null && Object.hasOwnProperty.call(message, "code"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.code);
        if (message.attribution != null && Object.hasOwnProperty.call(message, "attribution"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.attribution);
        if (message.customText != null && Object.hasOwnProperty.call(message, "customText"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.customText);
        return writer;
    };

    /**
     * Encodes the specified License message, length delimited. Does not implicitly {@link License.verify|verify} messages.
     * @function encodeDelimited
     * @memberof License
     * @static
     * @param {ILicense} message License message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    License.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a License message from the specified reader or buffer.
     * @function decode
     * @memberof License
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {License} License
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    License.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.License();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.code = reader.uint32();
                break;
            case 2:
                message.attribution = reader.string();
                break;
            case 3:
                message.customText = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a License message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof License
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {License} License
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    License.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a License message.
     * @function verify
     * @memberof License
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    License.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.code != null && message.hasOwnProperty("code"))
            if (!$util.isInteger(message.code))
                return "code: integer expected";
        if (message.attribution != null && message.hasOwnProperty("attribution"))
            if (!$util.isString(message.attribution))
                return "attribution: string expected";
        if (message.customText != null && message.hasOwnProperty("customText"))
            if (!$util.isString(message.customText))
                return "customText: string expected";
        return null;
    };

    /**
     * Creates a License message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof License
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {License} License
     */
    License.fromObject = function fromObject(object) {
        if (object instanceof $root.License)
            return object;
        var message = new $root.License();
        if (object.code != null)
            message.code = object.code >>> 0;
        if (object.attribution != null)
            message.attribution = String(object.attribution);
        if (object.customText != null)
            message.customText = String(object.customText);
        return message;
    };

    /**
     * Creates a plain object from a License message. Also converts values to other types if specified.
     * @function toObject
     * @memberof License
     * @static
     * @param {License} message License
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    License.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.code = 0;
            object.attribution = "";
            object.customText = "";
        }
        if (message.code != null && message.hasOwnProperty("code"))
            object.code = message.code;
        if (message.attribution != null && message.hasOwnProperty("attribution"))
            object.attribution = message.attribution;
        if (message.customText != null && message.hasOwnProperty("customText"))
            object.customText = message.customText;
        return object;
    };

    /**
     * Converts this License to JSON.
     * @function toJSON
     * @memberof License
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    License.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return License;
})();

$root.MediaType = (function() {

    /**
     * Properties of a MediaType.
     * @exports IMediaType
     * @interface IMediaType
     * @property {string|null} [codecName] MediaType codecName
     * @property {string|null} [container] MediaType container
     * @property {string|null} [mimeMediaType] MediaType mimeMediaType
     */

    /**
     * Constructs a new MediaType.
     * @exports MediaType
     * @classdesc Represents a MediaType.
     * @implements IMediaType
     * @constructor
     * @param {IMediaType=} [properties] Properties to set
     */
    function MediaType(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * MediaType codecName.
     * @member {string} codecName
     * @memberof MediaType
     * @instance
     */
    MediaType.prototype.codecName = "";

    /**
     * MediaType container.
     * @member {string} container
     * @memberof MediaType
     * @instance
     */
    MediaType.prototype.container = "";

    /**
     * MediaType mimeMediaType.
     * @member {string} mimeMediaType
     * @memberof MediaType
     * @instance
     */
    MediaType.prototype.mimeMediaType = "";

    /**
     * Creates a new MediaType instance using the specified properties.
     * @function create
     * @memberof MediaType
     * @static
     * @param {IMediaType=} [properties] Properties to set
     * @returns {MediaType} MediaType instance
     */
    MediaType.create = function create(properties) {
        return new MediaType(properties);
    };

    /**
     * Encodes the specified MediaType message. Does not implicitly {@link MediaType.verify|verify} messages.
     * @function encode
     * @memberof MediaType
     * @static
     * @param {IMediaType} message MediaType message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MediaType.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.codecName != null && Object.hasOwnProperty.call(message, "codecName"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.codecName);
        if (message.container != null && Object.hasOwnProperty.call(message, "container"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.container);
        if (message.mimeMediaType != null && Object.hasOwnProperty.call(message, "mimeMediaType"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.mimeMediaType);
        return writer;
    };

    /**
     * Encodes the specified MediaType message, length delimited. Does not implicitly {@link MediaType.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MediaType
     * @static
     * @param {IMediaType} message MediaType message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MediaType.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MediaType message from the specified reader or buffer.
     * @function decode
     * @memberof MediaType
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MediaType} MediaType
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MediaType.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.MediaType();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.codecName = reader.string();
                break;
            case 2:
                message.container = reader.string();
                break;
            case 3:
                message.mimeMediaType = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a MediaType message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MediaType
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MediaType} MediaType
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MediaType.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MediaType message.
     * @function verify
     * @memberof MediaType
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MediaType.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.codecName != null && message.hasOwnProperty("codecName"))
            if (!$util.isString(message.codecName))
                return "codecName: string expected";
        if (message.container != null && message.hasOwnProperty("container"))
            if (!$util.isString(message.container))
                return "container: string expected";
        if (message.mimeMediaType != null && message.hasOwnProperty("mimeMediaType"))
            if (!$util.isString(message.mimeMediaType))
                return "mimeMediaType: string expected";
        return null;
    };

    /**
     * Creates a MediaType message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MediaType
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MediaType} MediaType
     */
    MediaType.fromObject = function fromObject(object) {
        if (object instanceof $root.MediaType)
            return object;
        var message = new $root.MediaType();
        if (object.codecName != null)
            message.codecName = String(object.codecName);
        if (object.container != null)
            message.container = String(object.container);
        if (object.mimeMediaType != null)
            message.mimeMediaType = String(object.mimeMediaType);
        return message;
    };

    /**
     * Creates a plain object from a MediaType message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MediaType
     * @static
     * @param {MediaType} message MediaType
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MediaType.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.codecName = "";
            object.container = "";
            object.mimeMediaType = "";
        }
        if (message.codecName != null && message.hasOwnProperty("codecName"))
            object.codecName = message.codecName;
        if (message.container != null && message.hasOwnProperty("container"))
            object.container = message.container;
        if (message.mimeMediaType != null && message.hasOwnProperty("mimeMediaType"))
            object.mimeMediaType = message.mimeMediaType;
        return object;
    };

    /**
     * Converts this MediaType to JSON.
     * @function toJSON
     * @memberof MediaType
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MediaType.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return MediaType;
})();

$root.VideoMetadata = (function() {

    /**
     * Properties of a VideoMetadata.
     * @exports IVideoMetadata
     * @interface IVideoMetadata
     * @property {string|null} [title] VideoMetadata title
     * @property {string|null} [description] VideoMetadata description
     * @property {number|null} [video] VideoMetadata video
     * @property {number|null} [thumbnailPhoto] VideoMetadata thumbnailPhoto
     * @property {number|null} [duration] VideoMetadata duration
     * @property {number|null} [mediaPixelHeight] VideoMetadata mediaPixelHeight
     * @property {number|null} [mediaPixelWidth] VideoMetadata mediaPixelWidth
     * @property {IMediaType|null} [mediaType] VideoMetadata mediaType
     * @property {string|null} [language] VideoMetadata language
     * @property {ILicense|null} [license] VideoMetadata license
     * @property {IPublishedBeforeJoystream|null} [publishedBeforeJoystream] VideoMetadata publishedBeforeJoystream
     * @property {boolean|null} [hasMarketing] VideoMetadata hasMarketing
     * @property {boolean|null} [isPublic] VideoMetadata isPublic
     * @property {boolean|null} [isExplicit] VideoMetadata isExplicit
     * @property {Array.<Long>|null} [persons] VideoMetadata persons
     * @property {Long|null} [category] VideoMetadata category
     */

    /**
     * Constructs a new VideoMetadata.
     * @exports VideoMetadata
     * @classdesc Represents a VideoMetadata.
     * @implements IVideoMetadata
     * @constructor
     * @param {IVideoMetadata=} [properties] Properties to set
     */
    function VideoMetadata(properties) {
        this.persons = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * VideoMetadata title.
     * @member {string} title
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.title = "";

    /**
     * VideoMetadata description.
     * @member {string} description
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.description = "";

    /**
     * VideoMetadata video.
     * @member {number} video
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.video = 0;

    /**
     * VideoMetadata thumbnailPhoto.
     * @member {number} thumbnailPhoto
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.thumbnailPhoto = 0;

    /**
     * VideoMetadata duration.
     * @member {number} duration
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.duration = 0;

    /**
     * VideoMetadata mediaPixelHeight.
     * @member {number} mediaPixelHeight
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.mediaPixelHeight = 0;

    /**
     * VideoMetadata mediaPixelWidth.
     * @member {number} mediaPixelWidth
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.mediaPixelWidth = 0;

    /**
     * VideoMetadata mediaType.
     * @member {IMediaType|null|undefined} mediaType
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.mediaType = null;

    /**
     * VideoMetadata language.
     * @member {string} language
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.language = "";

    /**
     * VideoMetadata license.
     * @member {ILicense|null|undefined} license
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.license = null;

    /**
     * VideoMetadata publishedBeforeJoystream.
     * @member {IPublishedBeforeJoystream|null|undefined} publishedBeforeJoystream
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.publishedBeforeJoystream = null;

    /**
     * VideoMetadata hasMarketing.
     * @member {boolean} hasMarketing
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.hasMarketing = false;

    /**
     * VideoMetadata isPublic.
     * @member {boolean} isPublic
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.isPublic = false;

    /**
     * VideoMetadata isExplicit.
     * @member {boolean} isExplicit
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.isExplicit = false;

    /**
     * VideoMetadata persons.
     * @member {Array.<Long>} persons
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.persons = $util.emptyArray;

    /**
     * VideoMetadata category.
     * @member {Long} category
     * @memberof VideoMetadata
     * @instance
     */
    VideoMetadata.prototype.category = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Creates a new VideoMetadata instance using the specified properties.
     * @function create
     * @memberof VideoMetadata
     * @static
     * @param {IVideoMetadata=} [properties] Properties to set
     * @returns {VideoMetadata} VideoMetadata instance
     */
    VideoMetadata.create = function create(properties) {
        return new VideoMetadata(properties);
    };

    /**
     * Encodes the specified VideoMetadata message. Does not implicitly {@link VideoMetadata.verify|verify} messages.
     * @function encode
     * @memberof VideoMetadata
     * @static
     * @param {IVideoMetadata} message VideoMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    VideoMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.title);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.video != null && Object.hasOwnProperty.call(message, "video"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.video);
        if (message.thumbnailPhoto != null && Object.hasOwnProperty.call(message, "thumbnailPhoto"))
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.thumbnailPhoto);
        if (message.duration != null && Object.hasOwnProperty.call(message, "duration"))
            writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.duration);
        if (message.mediaPixelHeight != null && Object.hasOwnProperty.call(message, "mediaPixelHeight"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.mediaPixelHeight);
        if (message.mediaPixelWidth != null && Object.hasOwnProperty.call(message, "mediaPixelWidth"))
            writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.mediaPixelWidth);
        if (message.mediaType != null && Object.hasOwnProperty.call(message, "mediaType"))
            $root.MediaType.encode(message.mediaType, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
        if (message.language != null && Object.hasOwnProperty.call(message, "language"))
            writer.uint32(/* id 9, wireType 2 =*/74).string(message.language);
        if (message.license != null && Object.hasOwnProperty.call(message, "license"))
            $root.License.encode(message.license, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
        if (message.publishedBeforeJoystream != null && Object.hasOwnProperty.call(message, "publishedBeforeJoystream"))
            $root.PublishedBeforeJoystream.encode(message.publishedBeforeJoystream, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
        if (message.hasMarketing != null && Object.hasOwnProperty.call(message, "hasMarketing"))
            writer.uint32(/* id 12, wireType 0 =*/96).bool(message.hasMarketing);
        if (message.isPublic != null && Object.hasOwnProperty.call(message, "isPublic"))
            writer.uint32(/* id 13, wireType 0 =*/104).bool(message.isPublic);
        if (message.isExplicit != null && Object.hasOwnProperty.call(message, "isExplicit"))
            writer.uint32(/* id 14, wireType 0 =*/112).bool(message.isExplicit);
        if (message.persons != null && message.persons.length) {
            writer.uint32(/* id 15, wireType 2 =*/122).fork();
            for (var i = 0; i < message.persons.length; ++i)
                writer.uint64(message.persons[i]);
            writer.ldelim();
        }
        if (message.category != null && Object.hasOwnProperty.call(message, "category"))
            writer.uint32(/* id 16, wireType 0 =*/128).uint64(message.category);
        return writer;
    };

    /**
     * Encodes the specified VideoMetadata message, length delimited. Does not implicitly {@link VideoMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof VideoMetadata
     * @static
     * @param {IVideoMetadata} message VideoMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    VideoMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a VideoMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof VideoMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {VideoMetadata} VideoMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    VideoMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.VideoMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.title = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.video = reader.uint32();
                break;
            case 4:
                message.thumbnailPhoto = reader.uint32();
                break;
            case 5:
                message.duration = reader.uint32();
                break;
            case 6:
                message.mediaPixelHeight = reader.uint32();
                break;
            case 7:
                message.mediaPixelWidth = reader.uint32();
                break;
            case 8:
                message.mediaType = $root.MediaType.decode(reader, reader.uint32());
                break;
            case 9:
                message.language = reader.string();
                break;
            case 10:
                message.license = $root.License.decode(reader, reader.uint32());
                break;
            case 11:
                message.publishedBeforeJoystream = $root.PublishedBeforeJoystream.decode(reader, reader.uint32());
                break;
            case 12:
                message.hasMarketing = reader.bool();
                break;
            case 13:
                message.isPublic = reader.bool();
                break;
            case 14:
                message.isExplicit = reader.bool();
                break;
            case 15:
                if (!(message.persons && message.persons.length))
                    message.persons = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.persons.push(reader.uint64());
                } else
                    message.persons.push(reader.uint64());
                break;
            case 16:
                message.category = reader.uint64();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a VideoMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof VideoMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {VideoMetadata} VideoMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    VideoMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a VideoMetadata message.
     * @function verify
     * @memberof VideoMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    VideoMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.video != null && message.hasOwnProperty("video"))
            if (!$util.isInteger(message.video))
                return "video: integer expected";
        if (message.thumbnailPhoto != null && message.hasOwnProperty("thumbnailPhoto"))
            if (!$util.isInteger(message.thumbnailPhoto))
                return "thumbnailPhoto: integer expected";
        if (message.duration != null && message.hasOwnProperty("duration"))
            if (!$util.isInteger(message.duration))
                return "duration: integer expected";
        if (message.mediaPixelHeight != null && message.hasOwnProperty("mediaPixelHeight"))
            if (!$util.isInteger(message.mediaPixelHeight))
                return "mediaPixelHeight: integer expected";
        if (message.mediaPixelWidth != null && message.hasOwnProperty("mediaPixelWidth"))
            if (!$util.isInteger(message.mediaPixelWidth))
                return "mediaPixelWidth: integer expected";
        if (message.mediaType != null && message.hasOwnProperty("mediaType")) {
            var error = $root.MediaType.verify(message.mediaType);
            if (error)
                return "mediaType." + error;
        }
        if (message.language != null && message.hasOwnProperty("language"))
            if (!$util.isString(message.language))
                return "language: string expected";
        if (message.license != null && message.hasOwnProperty("license")) {
            var error = $root.License.verify(message.license);
            if (error)
                return "license." + error;
        }
        if (message.publishedBeforeJoystream != null && message.hasOwnProperty("publishedBeforeJoystream")) {
            var error = $root.PublishedBeforeJoystream.verify(message.publishedBeforeJoystream);
            if (error)
                return "publishedBeforeJoystream." + error;
        }
        if (message.hasMarketing != null && message.hasOwnProperty("hasMarketing"))
            if (typeof message.hasMarketing !== "boolean")
                return "hasMarketing: boolean expected";
        if (message.isPublic != null && message.hasOwnProperty("isPublic"))
            if (typeof message.isPublic !== "boolean")
                return "isPublic: boolean expected";
        if (message.isExplicit != null && message.hasOwnProperty("isExplicit"))
            if (typeof message.isExplicit !== "boolean")
                return "isExplicit: boolean expected";
        if (message.persons != null && message.hasOwnProperty("persons")) {
            if (!Array.isArray(message.persons))
                return "persons: array expected";
            for (var i = 0; i < message.persons.length; ++i)
                if (!$util.isInteger(message.persons[i]) && !(message.persons[i] && $util.isInteger(message.persons[i].low) && $util.isInteger(message.persons[i].high)))
                    return "persons: integer|Long[] expected";
        }
        if (message.category != null && message.hasOwnProperty("category"))
            if (!$util.isInteger(message.category) && !(message.category && $util.isInteger(message.category.low) && $util.isInteger(message.category.high)))
                return "category: integer|Long expected";
        return null;
    };

    /**
     * Creates a VideoMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof VideoMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {VideoMetadata} VideoMetadata
     */
    VideoMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.VideoMetadata)
            return object;
        var message = new $root.VideoMetadata();
        if (object.title != null)
            message.title = String(object.title);
        if (object.description != null)
            message.description = String(object.description);
        if (object.video != null)
            message.video = object.video >>> 0;
        if (object.thumbnailPhoto != null)
            message.thumbnailPhoto = object.thumbnailPhoto >>> 0;
        if (object.duration != null)
            message.duration = object.duration >>> 0;
        if (object.mediaPixelHeight != null)
            message.mediaPixelHeight = object.mediaPixelHeight >>> 0;
        if (object.mediaPixelWidth != null)
            message.mediaPixelWidth = object.mediaPixelWidth >>> 0;
        if (object.mediaType != null) {
            if (typeof object.mediaType !== "object")
                throw TypeError(".VideoMetadata.mediaType: object expected");
            message.mediaType = $root.MediaType.fromObject(object.mediaType);
        }
        if (object.language != null)
            message.language = String(object.language);
        if (object.license != null) {
            if (typeof object.license !== "object")
                throw TypeError(".VideoMetadata.license: object expected");
            message.license = $root.License.fromObject(object.license);
        }
        if (object.publishedBeforeJoystream != null) {
            if (typeof object.publishedBeforeJoystream !== "object")
                throw TypeError(".VideoMetadata.publishedBeforeJoystream: object expected");
            message.publishedBeforeJoystream = $root.PublishedBeforeJoystream.fromObject(object.publishedBeforeJoystream);
        }
        if (object.hasMarketing != null)
            message.hasMarketing = Boolean(object.hasMarketing);
        if (object.isPublic != null)
            message.isPublic = Boolean(object.isPublic);
        if (object.isExplicit != null)
            message.isExplicit = Boolean(object.isExplicit);
        if (object.persons) {
            if (!Array.isArray(object.persons))
                throw TypeError(".VideoMetadata.persons: array expected");
            message.persons = [];
            for (var i = 0; i < object.persons.length; ++i)
                if ($util.Long)
                    (message.persons[i] = $util.Long.fromValue(object.persons[i])).unsigned = true;
                else if (typeof object.persons[i] === "string")
                    message.persons[i] = parseInt(object.persons[i], 10);
                else if (typeof object.persons[i] === "number")
                    message.persons[i] = object.persons[i];
                else if (typeof object.persons[i] === "object")
                    message.persons[i] = new $util.LongBits(object.persons[i].low >>> 0, object.persons[i].high >>> 0).toNumber(true);
        }
        if (object.category != null)
            if ($util.Long)
                (message.category = $util.Long.fromValue(object.category)).unsigned = true;
            else if (typeof object.category === "string")
                message.category = parseInt(object.category, 10);
            else if (typeof object.category === "number")
                message.category = object.category;
            else if (typeof object.category === "object")
                message.category = new $util.LongBits(object.category.low >>> 0, object.category.high >>> 0).toNumber(true);
        return message;
    };

    /**
     * Creates a plain object from a VideoMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof VideoMetadata
     * @static
     * @param {VideoMetadata} message VideoMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    VideoMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.persons = [];
        if (options.defaults) {
            object.title = "";
            object.description = "";
            object.video = 0;
            object.thumbnailPhoto = 0;
            object.duration = 0;
            object.mediaPixelHeight = 0;
            object.mediaPixelWidth = 0;
            object.mediaType = null;
            object.language = "";
            object.license = null;
            object.publishedBeforeJoystream = null;
            object.hasMarketing = false;
            object.isPublic = false;
            object.isExplicit = false;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.category = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.category = options.longs === String ? "0" : 0;
        }
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.video != null && message.hasOwnProperty("video"))
            object.video = message.video;
        if (message.thumbnailPhoto != null && message.hasOwnProperty("thumbnailPhoto"))
            object.thumbnailPhoto = message.thumbnailPhoto;
        if (message.duration != null && message.hasOwnProperty("duration"))
            object.duration = message.duration;
        if (message.mediaPixelHeight != null && message.hasOwnProperty("mediaPixelHeight"))
            object.mediaPixelHeight = message.mediaPixelHeight;
        if (message.mediaPixelWidth != null && message.hasOwnProperty("mediaPixelWidth"))
            object.mediaPixelWidth = message.mediaPixelWidth;
        if (message.mediaType != null && message.hasOwnProperty("mediaType"))
            object.mediaType = $root.MediaType.toObject(message.mediaType, options);
        if (message.language != null && message.hasOwnProperty("language"))
            object.language = message.language;
        if (message.license != null && message.hasOwnProperty("license"))
            object.license = $root.License.toObject(message.license, options);
        if (message.publishedBeforeJoystream != null && message.hasOwnProperty("publishedBeforeJoystream"))
            object.publishedBeforeJoystream = $root.PublishedBeforeJoystream.toObject(message.publishedBeforeJoystream, options);
        if (message.hasMarketing != null && message.hasOwnProperty("hasMarketing"))
            object.hasMarketing = message.hasMarketing;
        if (message.isPublic != null && message.hasOwnProperty("isPublic"))
            object.isPublic = message.isPublic;
        if (message.isExplicit != null && message.hasOwnProperty("isExplicit"))
            object.isExplicit = message.isExplicit;
        if (message.persons && message.persons.length) {
            object.persons = [];
            for (var j = 0; j < message.persons.length; ++j)
                if (typeof message.persons[j] === "number")
                    object.persons[j] = options.longs === String ? String(message.persons[j]) : message.persons[j];
                else
                    object.persons[j] = options.longs === String ? $util.Long.prototype.toString.call(message.persons[j]) : options.longs === Number ? new $util.LongBits(message.persons[j].low >>> 0, message.persons[j].high >>> 0).toNumber(true) : message.persons[j];
        }
        if (message.category != null && message.hasOwnProperty("category"))
            if (typeof message.category === "number")
                object.category = options.longs === String ? String(message.category) : message.category;
            else
                object.category = options.longs === String ? $util.Long.prototype.toString.call(message.category) : options.longs === Number ? new $util.LongBits(message.category.low >>> 0, message.category.high >>> 0).toNumber(true) : message.category;
        return object;
    };

    /**
     * Converts this VideoMetadata to JSON.
     * @function toJSON
     * @memberof VideoMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    VideoMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return VideoMetadata;
})();

$root.VideoCategoryMetadata = (function() {

    /**
     * Properties of a VideoCategoryMetadata.
     * @exports IVideoCategoryMetadata
     * @interface IVideoCategoryMetadata
     * @property {string|null} [name] VideoCategoryMetadata name
     */

    /**
     * Constructs a new VideoCategoryMetadata.
     * @exports VideoCategoryMetadata
     * @classdesc Represents a VideoCategoryMetadata.
     * @implements IVideoCategoryMetadata
     * @constructor
     * @param {IVideoCategoryMetadata=} [properties] Properties to set
     */
    function VideoCategoryMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * VideoCategoryMetadata name.
     * @member {string} name
     * @memberof VideoCategoryMetadata
     * @instance
     */
    VideoCategoryMetadata.prototype.name = "";

    /**
     * Creates a new VideoCategoryMetadata instance using the specified properties.
     * @function create
     * @memberof VideoCategoryMetadata
     * @static
     * @param {IVideoCategoryMetadata=} [properties] Properties to set
     * @returns {VideoCategoryMetadata} VideoCategoryMetadata instance
     */
    VideoCategoryMetadata.create = function create(properties) {
        return new VideoCategoryMetadata(properties);
    };

    /**
     * Encodes the specified VideoCategoryMetadata message. Does not implicitly {@link VideoCategoryMetadata.verify|verify} messages.
     * @function encode
     * @memberof VideoCategoryMetadata
     * @static
     * @param {IVideoCategoryMetadata} message VideoCategoryMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    VideoCategoryMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        return writer;
    };

    /**
     * Encodes the specified VideoCategoryMetadata message, length delimited. Does not implicitly {@link VideoCategoryMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof VideoCategoryMetadata
     * @static
     * @param {IVideoCategoryMetadata} message VideoCategoryMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    VideoCategoryMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a VideoCategoryMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof VideoCategoryMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {VideoCategoryMetadata} VideoCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    VideoCategoryMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.VideoCategoryMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a VideoCategoryMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof VideoCategoryMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {VideoCategoryMetadata} VideoCategoryMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    VideoCategoryMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a VideoCategoryMetadata message.
     * @function verify
     * @memberof VideoCategoryMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    VideoCategoryMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        return null;
    };

    /**
     * Creates a VideoCategoryMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof VideoCategoryMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {VideoCategoryMetadata} VideoCategoryMetadata
     */
    VideoCategoryMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.VideoCategoryMetadata)
            return object;
        var message = new $root.VideoCategoryMetadata();
        if (object.name != null)
            message.name = String(object.name);
        return message;
    };

    /**
     * Creates a plain object from a VideoCategoryMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof VideoCategoryMetadata
     * @static
     * @param {VideoCategoryMetadata} message VideoCategoryMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    VideoCategoryMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.name = "";
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        return object;
    };

    /**
     * Converts this VideoCategoryMetadata to JSON.
     * @function toJSON
     * @memberof VideoCategoryMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    VideoCategoryMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return VideoCategoryMetadata;
})();

$root.OpeningMetadata = (function() {

    /**
     * Properties of an OpeningMetadata.
     * @exports IOpeningMetadata
     * @interface IOpeningMetadata
     * @property {string|null} [shortDescription] OpeningMetadata shortDescription
     * @property {string|null} [description] OpeningMetadata description
     * @property {number|null} [hiringLimit] OpeningMetadata hiringLimit
     * @property {number|null} [expectedEndingTimestamp] OpeningMetadata expectedEndingTimestamp
     * @property {string|null} [applicationDetails] OpeningMetadata applicationDetails
     * @property {Array.<OpeningMetadata.IApplicationFormQuestion>|null} [applicationFormQuestions] OpeningMetadata applicationFormQuestions
     */

    /**
     * Constructs a new OpeningMetadata.
     * @exports OpeningMetadata
     * @classdesc Represents an OpeningMetadata.
     * @implements IOpeningMetadata
     * @constructor
     * @param {IOpeningMetadata=} [properties] Properties to set
     */
    function OpeningMetadata(properties) {
        this.applicationFormQuestions = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * OpeningMetadata shortDescription.
     * @member {string} shortDescription
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.shortDescription = "";

    /**
     * OpeningMetadata description.
     * @member {string} description
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.description = "";

    /**
     * OpeningMetadata hiringLimit.
     * @member {number} hiringLimit
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.hiringLimit = 0;

    /**
     * OpeningMetadata expectedEndingTimestamp.
     * @member {number} expectedEndingTimestamp
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.expectedEndingTimestamp = 0;

    /**
     * OpeningMetadata applicationDetails.
     * @member {string} applicationDetails
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.applicationDetails = "";

    /**
     * OpeningMetadata applicationFormQuestions.
     * @member {Array.<OpeningMetadata.IApplicationFormQuestion>} applicationFormQuestions
     * @memberof OpeningMetadata
     * @instance
     */
    OpeningMetadata.prototype.applicationFormQuestions = $util.emptyArray;

    /**
     * Creates a new OpeningMetadata instance using the specified properties.
     * @function create
     * @memberof OpeningMetadata
     * @static
     * @param {IOpeningMetadata=} [properties] Properties to set
     * @returns {OpeningMetadata} OpeningMetadata instance
     */
    OpeningMetadata.create = function create(properties) {
        return new OpeningMetadata(properties);
    };

    /**
     * Encodes the specified OpeningMetadata message. Does not implicitly {@link OpeningMetadata.verify|verify} messages.
     * @function encode
     * @memberof OpeningMetadata
     * @static
     * @param {IOpeningMetadata} message OpeningMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OpeningMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.shortDescription != null && Object.hasOwnProperty.call(message, "shortDescription"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.shortDescription);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.hiringLimit != null && Object.hasOwnProperty.call(message, "hiringLimit"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.hiringLimit);
        if (message.expectedEndingTimestamp != null && Object.hasOwnProperty.call(message, "expectedEndingTimestamp"))
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.expectedEndingTimestamp);
        if (message.applicationDetails != null && Object.hasOwnProperty.call(message, "applicationDetails"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.applicationDetails);
        if (message.applicationFormQuestions != null && message.applicationFormQuestions.length)
            for (var i = 0; i < message.applicationFormQuestions.length; ++i)
                $root.OpeningMetadata.ApplicationFormQuestion.encode(message.applicationFormQuestions[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified OpeningMetadata message, length delimited. Does not implicitly {@link OpeningMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof OpeningMetadata
     * @static
     * @param {IOpeningMetadata} message OpeningMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    OpeningMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an OpeningMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof OpeningMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {OpeningMetadata} OpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OpeningMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.OpeningMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.shortDescription = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.hiringLimit = reader.uint32();
                break;
            case 4:
                message.expectedEndingTimestamp = reader.uint32();
                break;
            case 5:
                message.applicationDetails = reader.string();
                break;
            case 6:
                if (!(message.applicationFormQuestions && message.applicationFormQuestions.length))
                    message.applicationFormQuestions = [];
                message.applicationFormQuestions.push($root.OpeningMetadata.ApplicationFormQuestion.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an OpeningMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof OpeningMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {OpeningMetadata} OpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    OpeningMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an OpeningMetadata message.
     * @function verify
     * @memberof OpeningMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    OpeningMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.shortDescription != null && message.hasOwnProperty("shortDescription"))
            if (!$util.isString(message.shortDescription))
                return "shortDescription: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.hiringLimit != null && message.hasOwnProperty("hiringLimit"))
            if (!$util.isInteger(message.hiringLimit))
                return "hiringLimit: integer expected";
        if (message.expectedEndingTimestamp != null && message.hasOwnProperty("expectedEndingTimestamp"))
            if (!$util.isInteger(message.expectedEndingTimestamp))
                return "expectedEndingTimestamp: integer expected";
        if (message.applicationDetails != null && message.hasOwnProperty("applicationDetails"))
            if (!$util.isString(message.applicationDetails))
                return "applicationDetails: string expected";
        if (message.applicationFormQuestions != null && message.hasOwnProperty("applicationFormQuestions")) {
            if (!Array.isArray(message.applicationFormQuestions))
                return "applicationFormQuestions: array expected";
            for (var i = 0; i < message.applicationFormQuestions.length; ++i) {
                var error = $root.OpeningMetadata.ApplicationFormQuestion.verify(message.applicationFormQuestions[i]);
                if (error)
                    return "applicationFormQuestions." + error;
            }
        }
        return null;
    };

    /**
     * Creates an OpeningMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof OpeningMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {OpeningMetadata} OpeningMetadata
     */
    OpeningMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.OpeningMetadata)
            return object;
        var message = new $root.OpeningMetadata();
        if (object.shortDescription != null)
            message.shortDescription = String(object.shortDescription);
        if (object.description != null)
            message.description = String(object.description);
        if (object.hiringLimit != null)
            message.hiringLimit = object.hiringLimit >>> 0;
        if (object.expectedEndingTimestamp != null)
            message.expectedEndingTimestamp = object.expectedEndingTimestamp >>> 0;
        if (object.applicationDetails != null)
            message.applicationDetails = String(object.applicationDetails);
        if (object.applicationFormQuestions) {
            if (!Array.isArray(object.applicationFormQuestions))
                throw TypeError(".OpeningMetadata.applicationFormQuestions: array expected");
            message.applicationFormQuestions = [];
            for (var i = 0; i < object.applicationFormQuestions.length; ++i) {
                if (typeof object.applicationFormQuestions[i] !== "object")
                    throw TypeError(".OpeningMetadata.applicationFormQuestions: object expected");
                message.applicationFormQuestions[i] = $root.OpeningMetadata.ApplicationFormQuestion.fromObject(object.applicationFormQuestions[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from an OpeningMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof OpeningMetadata
     * @static
     * @param {OpeningMetadata} message OpeningMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    OpeningMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.applicationFormQuestions = [];
        if (options.defaults) {
            object.shortDescription = "";
            object.description = "";
            object.hiringLimit = 0;
            object.expectedEndingTimestamp = 0;
            object.applicationDetails = "";
        }
        if (message.shortDescription != null && message.hasOwnProperty("shortDescription"))
            object.shortDescription = message.shortDescription;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.hiringLimit != null && message.hasOwnProperty("hiringLimit"))
            object.hiringLimit = message.hiringLimit;
        if (message.expectedEndingTimestamp != null && message.hasOwnProperty("expectedEndingTimestamp"))
            object.expectedEndingTimestamp = message.expectedEndingTimestamp;
        if (message.applicationDetails != null && message.hasOwnProperty("applicationDetails"))
            object.applicationDetails = message.applicationDetails;
        if (message.applicationFormQuestions && message.applicationFormQuestions.length) {
            object.applicationFormQuestions = [];
            for (var j = 0; j < message.applicationFormQuestions.length; ++j)
                object.applicationFormQuestions[j] = $root.OpeningMetadata.ApplicationFormQuestion.toObject(message.applicationFormQuestions[j], options);
        }
        return object;
    };

    /**
     * Converts this OpeningMetadata to JSON.
     * @function toJSON
     * @memberof OpeningMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    OpeningMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    OpeningMetadata.ApplicationFormQuestion = (function() {

        /**
         * Properties of an ApplicationFormQuestion.
         * @memberof OpeningMetadata
         * @interface IApplicationFormQuestion
         * @property {string|null} [question] ApplicationFormQuestion question
         * @property {OpeningMetadata.ApplicationFormQuestion.InputType|null} [type] ApplicationFormQuestion type
         */

        /**
         * Constructs a new ApplicationFormQuestion.
         * @memberof OpeningMetadata
         * @classdesc Represents an ApplicationFormQuestion.
         * @implements IApplicationFormQuestion
         * @constructor
         * @param {OpeningMetadata.IApplicationFormQuestion=} [properties] Properties to set
         */
        function ApplicationFormQuestion(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ApplicationFormQuestion question.
         * @member {string} question
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @instance
         */
        ApplicationFormQuestion.prototype.question = "";

        /**
         * ApplicationFormQuestion type.
         * @member {OpeningMetadata.ApplicationFormQuestion.InputType} type
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @instance
         */
        ApplicationFormQuestion.prototype.type = 0;

        /**
         * Creates a new ApplicationFormQuestion instance using the specified properties.
         * @function create
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {OpeningMetadata.IApplicationFormQuestion=} [properties] Properties to set
         * @returns {OpeningMetadata.ApplicationFormQuestion} ApplicationFormQuestion instance
         */
        ApplicationFormQuestion.create = function create(properties) {
            return new ApplicationFormQuestion(properties);
        };

        /**
         * Encodes the specified ApplicationFormQuestion message. Does not implicitly {@link OpeningMetadata.ApplicationFormQuestion.verify|verify} messages.
         * @function encode
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {OpeningMetadata.IApplicationFormQuestion} message ApplicationFormQuestion message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ApplicationFormQuestion.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.question != null && Object.hasOwnProperty.call(message, "question"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.question);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified ApplicationFormQuestion message, length delimited. Does not implicitly {@link OpeningMetadata.ApplicationFormQuestion.verify|verify} messages.
         * @function encodeDelimited
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {OpeningMetadata.IApplicationFormQuestion} message ApplicationFormQuestion message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ApplicationFormQuestion.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ApplicationFormQuestion message from the specified reader or buffer.
         * @function decode
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {OpeningMetadata.ApplicationFormQuestion} ApplicationFormQuestion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ApplicationFormQuestion.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.OpeningMetadata.ApplicationFormQuestion();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.question = reader.string();
                    break;
                case 2:
                    message.type = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ApplicationFormQuestion message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {OpeningMetadata.ApplicationFormQuestion} ApplicationFormQuestion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ApplicationFormQuestion.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ApplicationFormQuestion message.
         * @function verify
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ApplicationFormQuestion.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.question != null && message.hasOwnProperty("question"))
                if (!$util.isString(message.question))
                    return "question: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                    break;
                }
            return null;
        };

        /**
         * Creates an ApplicationFormQuestion message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {OpeningMetadata.ApplicationFormQuestion} ApplicationFormQuestion
         */
        ApplicationFormQuestion.fromObject = function fromObject(object) {
            if (object instanceof $root.OpeningMetadata.ApplicationFormQuestion)
                return object;
            var message = new $root.OpeningMetadata.ApplicationFormQuestion();
            if (object.question != null)
                message.question = String(object.question);
            switch (object.type) {
            case "TEXTAREA":
            case 0:
                message.type = 0;
                break;
            case "TEXT":
            case 1:
                message.type = 1;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from an ApplicationFormQuestion message. Also converts values to other types if specified.
         * @function toObject
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @static
         * @param {OpeningMetadata.ApplicationFormQuestion} message ApplicationFormQuestion
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ApplicationFormQuestion.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.question = "";
                object.type = options.enums === String ? "TEXTAREA" : 0;
            }
            if (message.question != null && message.hasOwnProperty("question"))
                object.question = message.question;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.OpeningMetadata.ApplicationFormQuestion.InputType[message.type] : message.type;
            return object;
        };

        /**
         * Converts this ApplicationFormQuestion to JSON.
         * @function toJSON
         * @memberof OpeningMetadata.ApplicationFormQuestion
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ApplicationFormQuestion.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * InputType enum.
         * @name OpeningMetadata.ApplicationFormQuestion.InputType
         * @enum {number}
         * @property {number} TEXTAREA=0 TEXTAREA value
         * @property {number} TEXT=1 TEXT value
         */
        ApplicationFormQuestion.InputType = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "TEXTAREA"] = 0;
            values[valuesById[1] = "TEXT"] = 1;
            return values;
        })();

        return ApplicationFormQuestion;
    })();

    return OpeningMetadata;
})();

$root.UpcomingOpeningMetadata = (function() {

    /**
     * Properties of an UpcomingOpeningMetadata.
     * @exports IUpcomingOpeningMetadata
     * @interface IUpcomingOpeningMetadata
     * @property {number|null} [expectedStart] UpcomingOpeningMetadata expectedStart
     * @property {Long|null} [rewardPerBlock] UpcomingOpeningMetadata rewardPerBlock
     * @property {Long|null} [minApplicationStake] UpcomingOpeningMetadata minApplicationStake
     * @property {IOpeningMetadata|null} [metadata] UpcomingOpeningMetadata metadata
     */

    /**
     * Constructs a new UpcomingOpeningMetadata.
     * @exports UpcomingOpeningMetadata
     * @classdesc Represents an UpcomingOpeningMetadata.
     * @implements IUpcomingOpeningMetadata
     * @constructor
     * @param {IUpcomingOpeningMetadata=} [properties] Properties to set
     */
    function UpcomingOpeningMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UpcomingOpeningMetadata expectedStart.
     * @member {number} expectedStart
     * @memberof UpcomingOpeningMetadata
     * @instance
     */
    UpcomingOpeningMetadata.prototype.expectedStart = 0;

    /**
     * UpcomingOpeningMetadata rewardPerBlock.
     * @member {Long} rewardPerBlock
     * @memberof UpcomingOpeningMetadata
     * @instance
     */
    UpcomingOpeningMetadata.prototype.rewardPerBlock = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * UpcomingOpeningMetadata minApplicationStake.
     * @member {Long} minApplicationStake
     * @memberof UpcomingOpeningMetadata
     * @instance
     */
    UpcomingOpeningMetadata.prototype.minApplicationStake = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * UpcomingOpeningMetadata metadata.
     * @member {IOpeningMetadata|null|undefined} metadata
     * @memberof UpcomingOpeningMetadata
     * @instance
     */
    UpcomingOpeningMetadata.prototype.metadata = null;

    /**
     * Creates a new UpcomingOpeningMetadata instance using the specified properties.
     * @function create
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {IUpcomingOpeningMetadata=} [properties] Properties to set
     * @returns {UpcomingOpeningMetadata} UpcomingOpeningMetadata instance
     */
    UpcomingOpeningMetadata.create = function create(properties) {
        return new UpcomingOpeningMetadata(properties);
    };

    /**
     * Encodes the specified UpcomingOpeningMetadata message. Does not implicitly {@link UpcomingOpeningMetadata.verify|verify} messages.
     * @function encode
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {IUpcomingOpeningMetadata} message UpcomingOpeningMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UpcomingOpeningMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.expectedStart != null && Object.hasOwnProperty.call(message, "expectedStart"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.expectedStart);
        if (message.rewardPerBlock != null && Object.hasOwnProperty.call(message, "rewardPerBlock"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.rewardPerBlock);
        if (message.minApplicationStake != null && Object.hasOwnProperty.call(message, "minApplicationStake"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.minApplicationStake);
        if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
            $root.OpeningMetadata.encode(message.metadata, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified UpcomingOpeningMetadata message, length delimited. Does not implicitly {@link UpcomingOpeningMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {IUpcomingOpeningMetadata} message UpcomingOpeningMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UpcomingOpeningMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an UpcomingOpeningMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UpcomingOpeningMetadata} UpcomingOpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UpcomingOpeningMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.UpcomingOpeningMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.expectedStart = reader.uint32();
                break;
            case 2:
                message.rewardPerBlock = reader.uint64();
                break;
            case 3:
                message.minApplicationStake = reader.uint64();
                break;
            case 4:
                message.metadata = $root.OpeningMetadata.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an UpcomingOpeningMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UpcomingOpeningMetadata} UpcomingOpeningMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UpcomingOpeningMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an UpcomingOpeningMetadata message.
     * @function verify
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UpcomingOpeningMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.expectedStart != null && message.hasOwnProperty("expectedStart"))
            if (!$util.isInteger(message.expectedStart))
                return "expectedStart: integer expected";
        if (message.rewardPerBlock != null && message.hasOwnProperty("rewardPerBlock"))
            if (!$util.isInteger(message.rewardPerBlock) && !(message.rewardPerBlock && $util.isInteger(message.rewardPerBlock.low) && $util.isInteger(message.rewardPerBlock.high)))
                return "rewardPerBlock: integer|Long expected";
        if (message.minApplicationStake != null && message.hasOwnProperty("minApplicationStake"))
            if (!$util.isInteger(message.minApplicationStake) && !(message.minApplicationStake && $util.isInteger(message.minApplicationStake.low) && $util.isInteger(message.minApplicationStake.high)))
                return "minApplicationStake: integer|Long expected";
        if (message.metadata != null && message.hasOwnProperty("metadata")) {
            var error = $root.OpeningMetadata.verify(message.metadata);
            if (error)
                return "metadata." + error;
        }
        return null;
    };

    /**
     * Creates an UpcomingOpeningMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UpcomingOpeningMetadata} UpcomingOpeningMetadata
     */
    UpcomingOpeningMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.UpcomingOpeningMetadata)
            return object;
        var message = new $root.UpcomingOpeningMetadata();
        if (object.expectedStart != null)
            message.expectedStart = object.expectedStart >>> 0;
        if (object.rewardPerBlock != null)
            if ($util.Long)
                (message.rewardPerBlock = $util.Long.fromValue(object.rewardPerBlock)).unsigned = true;
            else if (typeof object.rewardPerBlock === "string")
                message.rewardPerBlock = parseInt(object.rewardPerBlock, 10);
            else if (typeof object.rewardPerBlock === "number")
                message.rewardPerBlock = object.rewardPerBlock;
            else if (typeof object.rewardPerBlock === "object")
                message.rewardPerBlock = new $util.LongBits(object.rewardPerBlock.low >>> 0, object.rewardPerBlock.high >>> 0).toNumber(true);
        if (object.minApplicationStake != null)
            if ($util.Long)
                (message.minApplicationStake = $util.Long.fromValue(object.minApplicationStake)).unsigned = true;
            else if (typeof object.minApplicationStake === "string")
                message.minApplicationStake = parseInt(object.minApplicationStake, 10);
            else if (typeof object.minApplicationStake === "number")
                message.minApplicationStake = object.minApplicationStake;
            else if (typeof object.minApplicationStake === "object")
                message.minApplicationStake = new $util.LongBits(object.minApplicationStake.low >>> 0, object.minApplicationStake.high >>> 0).toNumber(true);
        if (object.metadata != null) {
            if (typeof object.metadata !== "object")
                throw TypeError(".UpcomingOpeningMetadata.metadata: object expected");
            message.metadata = $root.OpeningMetadata.fromObject(object.metadata);
        }
        return message;
    };

    /**
     * Creates a plain object from an UpcomingOpeningMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UpcomingOpeningMetadata
     * @static
     * @param {UpcomingOpeningMetadata} message UpcomingOpeningMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UpcomingOpeningMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.expectedStart = 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.rewardPerBlock = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.rewardPerBlock = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.minApplicationStake = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.minApplicationStake = options.longs === String ? "0" : 0;
            object.metadata = null;
        }
        if (message.expectedStart != null && message.hasOwnProperty("expectedStart"))
            object.expectedStart = message.expectedStart;
        if (message.rewardPerBlock != null && message.hasOwnProperty("rewardPerBlock"))
            if (typeof message.rewardPerBlock === "number")
                object.rewardPerBlock = options.longs === String ? String(message.rewardPerBlock) : message.rewardPerBlock;
            else
                object.rewardPerBlock = options.longs === String ? $util.Long.prototype.toString.call(message.rewardPerBlock) : options.longs === Number ? new $util.LongBits(message.rewardPerBlock.low >>> 0, message.rewardPerBlock.high >>> 0).toNumber(true) : message.rewardPerBlock;
        if (message.minApplicationStake != null && message.hasOwnProperty("minApplicationStake"))
            if (typeof message.minApplicationStake === "number")
                object.minApplicationStake = options.longs === String ? String(message.minApplicationStake) : message.minApplicationStake;
            else
                object.minApplicationStake = options.longs === String ? $util.Long.prototype.toString.call(message.minApplicationStake) : options.longs === Number ? new $util.LongBits(message.minApplicationStake.low >>> 0, message.minApplicationStake.high >>> 0).toNumber(true) : message.minApplicationStake;
        if (message.metadata != null && message.hasOwnProperty("metadata"))
            object.metadata = $root.OpeningMetadata.toObject(message.metadata, options);
        return object;
    };

    /**
     * Converts this UpcomingOpeningMetadata to JSON.
     * @function toJSON
     * @memberof UpcomingOpeningMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UpcomingOpeningMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return UpcomingOpeningMetadata;
})();

$root.ApplicationMetadata = (function() {

    /**
     * Properties of an ApplicationMetadata.
     * @exports IApplicationMetadata
     * @interface IApplicationMetadata
     * @property {Array.<string>|null} [answers] ApplicationMetadata answers
     */

    /**
     * Constructs a new ApplicationMetadata.
     * @exports ApplicationMetadata
     * @classdesc Represents an ApplicationMetadata.
     * @implements IApplicationMetadata
     * @constructor
     * @param {IApplicationMetadata=} [properties] Properties to set
     */
    function ApplicationMetadata(properties) {
        this.answers = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ApplicationMetadata answers.
     * @member {Array.<string>} answers
     * @memberof ApplicationMetadata
     * @instance
     */
    ApplicationMetadata.prototype.answers = $util.emptyArray;

    /**
     * Creates a new ApplicationMetadata instance using the specified properties.
     * @function create
     * @memberof ApplicationMetadata
     * @static
     * @param {IApplicationMetadata=} [properties] Properties to set
     * @returns {ApplicationMetadata} ApplicationMetadata instance
     */
    ApplicationMetadata.create = function create(properties) {
        return new ApplicationMetadata(properties);
    };

    /**
     * Encodes the specified ApplicationMetadata message. Does not implicitly {@link ApplicationMetadata.verify|verify} messages.
     * @function encode
     * @memberof ApplicationMetadata
     * @static
     * @param {IApplicationMetadata} message ApplicationMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ApplicationMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.answers != null && message.answers.length)
            for (var i = 0; i < message.answers.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.answers[i]);
        return writer;
    };

    /**
     * Encodes the specified ApplicationMetadata message, length delimited. Does not implicitly {@link ApplicationMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ApplicationMetadata
     * @static
     * @param {IApplicationMetadata} message ApplicationMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ApplicationMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an ApplicationMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof ApplicationMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ApplicationMetadata} ApplicationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ApplicationMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ApplicationMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.answers && message.answers.length))
                    message.answers = [];
                message.answers.push(reader.string());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an ApplicationMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ApplicationMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ApplicationMetadata} ApplicationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ApplicationMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an ApplicationMetadata message.
     * @function verify
     * @memberof ApplicationMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ApplicationMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.answers != null && message.hasOwnProperty("answers")) {
            if (!Array.isArray(message.answers))
                return "answers: array expected";
            for (var i = 0; i < message.answers.length; ++i)
                if (!$util.isString(message.answers[i]))
                    return "answers: string[] expected";
        }
        return null;
    };

    /**
     * Creates an ApplicationMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ApplicationMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ApplicationMetadata} ApplicationMetadata
     */
    ApplicationMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.ApplicationMetadata)
            return object;
        var message = new $root.ApplicationMetadata();
        if (object.answers) {
            if (!Array.isArray(object.answers))
                throw TypeError(".ApplicationMetadata.answers: array expected");
            message.answers = [];
            for (var i = 0; i < object.answers.length; ++i)
                message.answers[i] = String(object.answers[i]);
        }
        return message;
    };

    /**
     * Creates a plain object from an ApplicationMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ApplicationMetadata
     * @static
     * @param {ApplicationMetadata} message ApplicationMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ApplicationMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.answers = [];
        if (message.answers && message.answers.length) {
            object.answers = [];
            for (var j = 0; j < message.answers.length; ++j)
                object.answers[j] = message.answers[j];
        }
        return object;
    };

    /**
     * Converts this ApplicationMetadata to JSON.
     * @function toJSON
     * @memberof ApplicationMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ApplicationMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return ApplicationMetadata;
})();

$root.WorkingGroupMetadata = (function() {

    /**
     * Properties of a WorkingGroupMetadata.
     * @exports IWorkingGroupMetadata
     * @interface IWorkingGroupMetadata
     * @property {string|null} [description] WorkingGroupMetadata description
     * @property {string|null} [about] WorkingGroupMetadata about
     * @property {string|null} [status] WorkingGroupMetadata status
     * @property {string|null} [statusMessage] WorkingGroupMetadata statusMessage
     */

    /**
     * Constructs a new WorkingGroupMetadata.
     * @exports WorkingGroupMetadata
     * @classdesc Represents a WorkingGroupMetadata.
     * @implements IWorkingGroupMetadata
     * @constructor
     * @param {IWorkingGroupMetadata=} [properties] Properties to set
     */
    function WorkingGroupMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WorkingGroupMetadata description.
     * @member {string} description
     * @memberof WorkingGroupMetadata
     * @instance
     */
    WorkingGroupMetadata.prototype.description = "";

    /**
     * WorkingGroupMetadata about.
     * @member {string} about
     * @memberof WorkingGroupMetadata
     * @instance
     */
    WorkingGroupMetadata.prototype.about = "";

    /**
     * WorkingGroupMetadata status.
     * @member {string} status
     * @memberof WorkingGroupMetadata
     * @instance
     */
    WorkingGroupMetadata.prototype.status = "";

    /**
     * WorkingGroupMetadata statusMessage.
     * @member {string} statusMessage
     * @memberof WorkingGroupMetadata
     * @instance
     */
    WorkingGroupMetadata.prototype.statusMessage = "";

    /**
     * Creates a new WorkingGroupMetadata instance using the specified properties.
     * @function create
     * @memberof WorkingGroupMetadata
     * @static
     * @param {IWorkingGroupMetadata=} [properties] Properties to set
     * @returns {WorkingGroupMetadata} WorkingGroupMetadata instance
     */
    WorkingGroupMetadata.create = function create(properties) {
        return new WorkingGroupMetadata(properties);
    };

    /**
     * Encodes the specified WorkingGroupMetadata message. Does not implicitly {@link WorkingGroupMetadata.verify|verify} messages.
     * @function encode
     * @memberof WorkingGroupMetadata
     * @static
     * @param {IWorkingGroupMetadata} message WorkingGroupMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WorkingGroupMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.description);
        if (message.about != null && Object.hasOwnProperty.call(message, "about"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.about);
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.status);
        if (message.statusMessage != null && Object.hasOwnProperty.call(message, "statusMessage"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.statusMessage);
        return writer;
    };

    /**
     * Encodes the specified WorkingGroupMetadata message, length delimited. Does not implicitly {@link WorkingGroupMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WorkingGroupMetadata
     * @static
     * @param {IWorkingGroupMetadata} message WorkingGroupMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WorkingGroupMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WorkingGroupMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof WorkingGroupMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WorkingGroupMetadata} WorkingGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WorkingGroupMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.WorkingGroupMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.description = reader.string();
                break;
            case 2:
                message.about = reader.string();
                break;
            case 3:
                message.status = reader.string();
                break;
            case 4:
                message.statusMessage = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WorkingGroupMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WorkingGroupMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WorkingGroupMetadata} WorkingGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WorkingGroupMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WorkingGroupMetadata message.
     * @function verify
     * @memberof WorkingGroupMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WorkingGroupMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.about != null && message.hasOwnProperty("about"))
            if (!$util.isString(message.about))
                return "about: string expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isString(message.status))
                return "status: string expected";
        if (message.statusMessage != null && message.hasOwnProperty("statusMessage"))
            if (!$util.isString(message.statusMessage))
                return "statusMessage: string expected";
        return null;
    };

    /**
     * Creates a WorkingGroupMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WorkingGroupMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WorkingGroupMetadata} WorkingGroupMetadata
     */
    WorkingGroupMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.WorkingGroupMetadata)
            return object;
        var message = new $root.WorkingGroupMetadata();
        if (object.description != null)
            message.description = String(object.description);
        if (object.about != null)
            message.about = String(object.about);
        if (object.status != null)
            message.status = String(object.status);
        if (object.statusMessage != null)
            message.statusMessage = String(object.statusMessage);
        return message;
    };

    /**
     * Creates a plain object from a WorkingGroupMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WorkingGroupMetadata
     * @static
     * @param {WorkingGroupMetadata} message WorkingGroupMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WorkingGroupMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.description = "";
            object.about = "";
            object.status = "";
            object.statusMessage = "";
        }
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.about != null && message.hasOwnProperty("about"))
            object.about = message.about;
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = message.status;
        if (message.statusMessage != null && message.hasOwnProperty("statusMessage"))
            object.statusMessage = message.statusMessage;
        return object;
    };

    /**
     * Converts this WorkingGroupMetadata to JSON.
     * @function toJSON
     * @memberof WorkingGroupMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WorkingGroupMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WorkingGroupMetadata;
})();

$root.SetGroupMetadata = (function() {

    /**
     * Properties of a SetGroupMetadata.
     * @exports ISetGroupMetadata
     * @interface ISetGroupMetadata
     * @property {IWorkingGroupMetadata|null} [newMetadata] SetGroupMetadata newMetadata
     */

    /**
     * Constructs a new SetGroupMetadata.
     * @exports SetGroupMetadata
     * @classdesc Represents a SetGroupMetadata.
     * @implements ISetGroupMetadata
     * @constructor
     * @param {ISetGroupMetadata=} [properties] Properties to set
     */
    function SetGroupMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SetGroupMetadata newMetadata.
     * @member {IWorkingGroupMetadata|null|undefined} newMetadata
     * @memberof SetGroupMetadata
     * @instance
     */
    SetGroupMetadata.prototype.newMetadata = null;

    /**
     * Creates a new SetGroupMetadata instance using the specified properties.
     * @function create
     * @memberof SetGroupMetadata
     * @static
     * @param {ISetGroupMetadata=} [properties] Properties to set
     * @returns {SetGroupMetadata} SetGroupMetadata instance
     */
    SetGroupMetadata.create = function create(properties) {
        return new SetGroupMetadata(properties);
    };

    /**
     * Encodes the specified SetGroupMetadata message. Does not implicitly {@link SetGroupMetadata.verify|verify} messages.
     * @function encode
     * @memberof SetGroupMetadata
     * @static
     * @param {ISetGroupMetadata} message SetGroupMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SetGroupMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.newMetadata != null && Object.hasOwnProperty.call(message, "newMetadata"))
            $root.WorkingGroupMetadata.encode(message.newMetadata, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SetGroupMetadata message, length delimited. Does not implicitly {@link SetGroupMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SetGroupMetadata
     * @static
     * @param {ISetGroupMetadata} message SetGroupMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SetGroupMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SetGroupMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof SetGroupMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SetGroupMetadata} SetGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SetGroupMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SetGroupMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.newMetadata = $root.WorkingGroupMetadata.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SetGroupMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SetGroupMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SetGroupMetadata} SetGroupMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SetGroupMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SetGroupMetadata message.
     * @function verify
     * @memberof SetGroupMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SetGroupMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.newMetadata != null && message.hasOwnProperty("newMetadata")) {
            var error = $root.WorkingGroupMetadata.verify(message.newMetadata);
            if (error)
                return "newMetadata." + error;
        }
        return null;
    };

    /**
     * Creates a SetGroupMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SetGroupMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SetGroupMetadata} SetGroupMetadata
     */
    SetGroupMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.SetGroupMetadata)
            return object;
        var message = new $root.SetGroupMetadata();
        if (object.newMetadata != null) {
            if (typeof object.newMetadata !== "object")
                throw TypeError(".SetGroupMetadata.newMetadata: object expected");
            message.newMetadata = $root.WorkingGroupMetadata.fromObject(object.newMetadata);
        }
        return message;
    };

    /**
     * Creates a plain object from a SetGroupMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SetGroupMetadata
     * @static
     * @param {SetGroupMetadata} message SetGroupMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SetGroupMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.newMetadata = null;
        if (message.newMetadata != null && message.hasOwnProperty("newMetadata"))
            object.newMetadata = $root.WorkingGroupMetadata.toObject(message.newMetadata, options);
        return object;
    };

    /**
     * Converts this SetGroupMetadata to JSON.
     * @function toJSON
     * @memberof SetGroupMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SetGroupMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SetGroupMetadata;
})();

$root.AddUpcomingOpening = (function() {

    /**
     * Properties of an AddUpcomingOpening.
     * @exports IAddUpcomingOpening
     * @interface IAddUpcomingOpening
     * @property {IUpcomingOpeningMetadata|null} [metadata] AddUpcomingOpening metadata
     */

    /**
     * Constructs a new AddUpcomingOpening.
     * @exports AddUpcomingOpening
     * @classdesc Represents an AddUpcomingOpening.
     * @implements IAddUpcomingOpening
     * @constructor
     * @param {IAddUpcomingOpening=} [properties] Properties to set
     */
    function AddUpcomingOpening(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * AddUpcomingOpening metadata.
     * @member {IUpcomingOpeningMetadata|null|undefined} metadata
     * @memberof AddUpcomingOpening
     * @instance
     */
    AddUpcomingOpening.prototype.metadata = null;

    /**
     * Creates a new AddUpcomingOpening instance using the specified properties.
     * @function create
     * @memberof AddUpcomingOpening
     * @static
     * @param {IAddUpcomingOpening=} [properties] Properties to set
     * @returns {AddUpcomingOpening} AddUpcomingOpening instance
     */
    AddUpcomingOpening.create = function create(properties) {
        return new AddUpcomingOpening(properties);
    };

    /**
     * Encodes the specified AddUpcomingOpening message. Does not implicitly {@link AddUpcomingOpening.verify|verify} messages.
     * @function encode
     * @memberof AddUpcomingOpening
     * @static
     * @param {IAddUpcomingOpening} message AddUpcomingOpening message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AddUpcomingOpening.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
            $root.UpcomingOpeningMetadata.encode(message.metadata, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified AddUpcomingOpening message, length delimited. Does not implicitly {@link AddUpcomingOpening.verify|verify} messages.
     * @function encodeDelimited
     * @memberof AddUpcomingOpening
     * @static
     * @param {IAddUpcomingOpening} message AddUpcomingOpening message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AddUpcomingOpening.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an AddUpcomingOpening message from the specified reader or buffer.
     * @function decode
     * @memberof AddUpcomingOpening
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {AddUpcomingOpening} AddUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AddUpcomingOpening.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.AddUpcomingOpening();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.metadata = $root.UpcomingOpeningMetadata.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an AddUpcomingOpening message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof AddUpcomingOpening
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {AddUpcomingOpening} AddUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AddUpcomingOpening.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an AddUpcomingOpening message.
     * @function verify
     * @memberof AddUpcomingOpening
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AddUpcomingOpening.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.metadata != null && message.hasOwnProperty("metadata")) {
            var error = $root.UpcomingOpeningMetadata.verify(message.metadata);
            if (error)
                return "metadata." + error;
        }
        return null;
    };

    /**
     * Creates an AddUpcomingOpening message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof AddUpcomingOpening
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {AddUpcomingOpening} AddUpcomingOpening
     */
    AddUpcomingOpening.fromObject = function fromObject(object) {
        if (object instanceof $root.AddUpcomingOpening)
            return object;
        var message = new $root.AddUpcomingOpening();
        if (object.metadata != null) {
            if (typeof object.metadata !== "object")
                throw TypeError(".AddUpcomingOpening.metadata: object expected");
            message.metadata = $root.UpcomingOpeningMetadata.fromObject(object.metadata);
        }
        return message;
    };

    /**
     * Creates a plain object from an AddUpcomingOpening message. Also converts values to other types if specified.
     * @function toObject
     * @memberof AddUpcomingOpening
     * @static
     * @param {AddUpcomingOpening} message AddUpcomingOpening
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AddUpcomingOpening.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.metadata = null;
        if (message.metadata != null && message.hasOwnProperty("metadata"))
            object.metadata = $root.UpcomingOpeningMetadata.toObject(message.metadata, options);
        return object;
    };

    /**
     * Converts this AddUpcomingOpening to JSON.
     * @function toJSON
     * @memberof AddUpcomingOpening
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AddUpcomingOpening.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return AddUpcomingOpening;
})();

$root.RemoveUpcomingOpening = (function() {

    /**
     * Properties of a RemoveUpcomingOpening.
     * @exports IRemoveUpcomingOpening
     * @interface IRemoveUpcomingOpening
     * @property {string|null} [id] RemoveUpcomingOpening id
     */

    /**
     * Constructs a new RemoveUpcomingOpening.
     * @exports RemoveUpcomingOpening
     * @classdesc Represents a RemoveUpcomingOpening.
     * @implements IRemoveUpcomingOpening
     * @constructor
     * @param {IRemoveUpcomingOpening=} [properties] Properties to set
     */
    function RemoveUpcomingOpening(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * RemoveUpcomingOpening id.
     * @member {string} id
     * @memberof RemoveUpcomingOpening
     * @instance
     */
    RemoveUpcomingOpening.prototype.id = "";

    /**
     * Creates a new RemoveUpcomingOpening instance using the specified properties.
     * @function create
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {IRemoveUpcomingOpening=} [properties] Properties to set
     * @returns {RemoveUpcomingOpening} RemoveUpcomingOpening instance
     */
    RemoveUpcomingOpening.create = function create(properties) {
        return new RemoveUpcomingOpening(properties);
    };

    /**
     * Encodes the specified RemoveUpcomingOpening message. Does not implicitly {@link RemoveUpcomingOpening.verify|verify} messages.
     * @function encode
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {IRemoveUpcomingOpening} message RemoveUpcomingOpening message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RemoveUpcomingOpening.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
        return writer;
    };

    /**
     * Encodes the specified RemoveUpcomingOpening message, length delimited. Does not implicitly {@link RemoveUpcomingOpening.verify|verify} messages.
     * @function encodeDelimited
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {IRemoveUpcomingOpening} message RemoveUpcomingOpening message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RemoveUpcomingOpening.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RemoveUpcomingOpening message from the specified reader or buffer.
     * @function decode
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {RemoveUpcomingOpening} RemoveUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RemoveUpcomingOpening.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.RemoveUpcomingOpening();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.id = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a RemoveUpcomingOpening message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {RemoveUpcomingOpening} RemoveUpcomingOpening
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RemoveUpcomingOpening.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RemoveUpcomingOpening message.
     * @function verify
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RemoveUpcomingOpening.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isString(message.id))
                return "id: string expected";
        return null;
    };

    /**
     * Creates a RemoveUpcomingOpening message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {RemoveUpcomingOpening} RemoveUpcomingOpening
     */
    RemoveUpcomingOpening.fromObject = function fromObject(object) {
        if (object instanceof $root.RemoveUpcomingOpening)
            return object;
        var message = new $root.RemoveUpcomingOpening();
        if (object.id != null)
            message.id = String(object.id);
        return message;
    };

    /**
     * Creates a plain object from a RemoveUpcomingOpening message. Also converts values to other types if specified.
     * @function toObject
     * @memberof RemoveUpcomingOpening
     * @static
     * @param {RemoveUpcomingOpening} message RemoveUpcomingOpening
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RemoveUpcomingOpening.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.id = "";
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        return object;
    };

    /**
     * Converts this RemoveUpcomingOpening to JSON.
     * @function toJSON
     * @memberof RemoveUpcomingOpening
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RemoveUpcomingOpening.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return RemoveUpcomingOpening;
})();

$root.WorkingGroupMetadataAction = (function() {

    /**
     * Properties of a WorkingGroupMetadataAction.
     * @exports IWorkingGroupMetadataAction
     * @interface IWorkingGroupMetadataAction
     * @property {ISetGroupMetadata|null} [setGroupMetadata] WorkingGroupMetadataAction setGroupMetadata
     * @property {IAddUpcomingOpening|null} [addUpcomingOpening] WorkingGroupMetadataAction addUpcomingOpening
     * @property {IRemoveUpcomingOpening|null} [removeUpcomingOpening] WorkingGroupMetadataAction removeUpcomingOpening
     */

    /**
     * Constructs a new WorkingGroupMetadataAction.
     * @exports WorkingGroupMetadataAction
     * @classdesc Represents a WorkingGroupMetadataAction.
     * @implements IWorkingGroupMetadataAction
     * @constructor
     * @param {IWorkingGroupMetadataAction=} [properties] Properties to set
     */
    function WorkingGroupMetadataAction(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WorkingGroupMetadataAction setGroupMetadata.
     * @member {ISetGroupMetadata|null|undefined} setGroupMetadata
     * @memberof WorkingGroupMetadataAction
     * @instance
     */
    WorkingGroupMetadataAction.prototype.setGroupMetadata = null;

    /**
     * WorkingGroupMetadataAction addUpcomingOpening.
     * @member {IAddUpcomingOpening|null|undefined} addUpcomingOpening
     * @memberof WorkingGroupMetadataAction
     * @instance
     */
    WorkingGroupMetadataAction.prototype.addUpcomingOpening = null;

    /**
     * WorkingGroupMetadataAction removeUpcomingOpening.
     * @member {IRemoveUpcomingOpening|null|undefined} removeUpcomingOpening
     * @memberof WorkingGroupMetadataAction
     * @instance
     */
    WorkingGroupMetadataAction.prototype.removeUpcomingOpening = null;

    // OneOf field names bound to virtual getters and setters
    var $oneOfFields;

    /**
     * WorkingGroupMetadataAction action.
     * @member {"setGroupMetadata"|"addUpcomingOpening"|"removeUpcomingOpening"|undefined} action
     * @memberof WorkingGroupMetadataAction
     * @instance
     */
    Object.defineProperty(WorkingGroupMetadataAction.prototype, "action", {
        get: $util.oneOfGetter($oneOfFields = ["setGroupMetadata", "addUpcomingOpening", "removeUpcomingOpening"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * Creates a new WorkingGroupMetadataAction instance using the specified properties.
     * @function create
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {IWorkingGroupMetadataAction=} [properties] Properties to set
     * @returns {WorkingGroupMetadataAction} WorkingGroupMetadataAction instance
     */
    WorkingGroupMetadataAction.create = function create(properties) {
        return new WorkingGroupMetadataAction(properties);
    };

    /**
     * Encodes the specified WorkingGroupMetadataAction message. Does not implicitly {@link WorkingGroupMetadataAction.verify|verify} messages.
     * @function encode
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {IWorkingGroupMetadataAction} message WorkingGroupMetadataAction message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WorkingGroupMetadataAction.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.setGroupMetadata != null && Object.hasOwnProperty.call(message, "setGroupMetadata"))
            $root.SetGroupMetadata.encode(message.setGroupMetadata, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.addUpcomingOpening != null && Object.hasOwnProperty.call(message, "addUpcomingOpening"))
            $root.AddUpcomingOpening.encode(message.addUpcomingOpening, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.removeUpcomingOpening != null && Object.hasOwnProperty.call(message, "removeUpcomingOpening"))
            $root.RemoveUpcomingOpening.encode(message.removeUpcomingOpening, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified WorkingGroupMetadataAction message, length delimited. Does not implicitly {@link WorkingGroupMetadataAction.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {IWorkingGroupMetadataAction} message WorkingGroupMetadataAction message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WorkingGroupMetadataAction.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WorkingGroupMetadataAction message from the specified reader or buffer.
     * @function decode
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WorkingGroupMetadataAction} WorkingGroupMetadataAction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WorkingGroupMetadataAction.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.WorkingGroupMetadataAction();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.setGroupMetadata = $root.SetGroupMetadata.decode(reader, reader.uint32());
                break;
            case 2:
                message.addUpcomingOpening = $root.AddUpcomingOpening.decode(reader, reader.uint32());
                break;
            case 3:
                message.removeUpcomingOpening = $root.RemoveUpcomingOpening.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WorkingGroupMetadataAction message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WorkingGroupMetadataAction} WorkingGroupMetadataAction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WorkingGroupMetadataAction.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WorkingGroupMetadataAction message.
     * @function verify
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WorkingGroupMetadataAction.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        var properties = {};
        if (message.setGroupMetadata != null && message.hasOwnProperty("setGroupMetadata")) {
            properties.action = 1;
            {
                var error = $root.SetGroupMetadata.verify(message.setGroupMetadata);
                if (error)
                    return "setGroupMetadata." + error;
            }
        }
        if (message.addUpcomingOpening != null && message.hasOwnProperty("addUpcomingOpening")) {
            if (properties.action === 1)
                return "action: multiple values";
            properties.action = 1;
            {
                var error = $root.AddUpcomingOpening.verify(message.addUpcomingOpening);
                if (error)
                    return "addUpcomingOpening." + error;
            }
        }
        if (message.removeUpcomingOpening != null && message.hasOwnProperty("removeUpcomingOpening")) {
            if (properties.action === 1)
                return "action: multiple values";
            properties.action = 1;
            {
                var error = $root.RemoveUpcomingOpening.verify(message.removeUpcomingOpening);
                if (error)
                    return "removeUpcomingOpening." + error;
            }
        }
        return null;
    };

    /**
     * Creates a WorkingGroupMetadataAction message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WorkingGroupMetadataAction} WorkingGroupMetadataAction
     */
    WorkingGroupMetadataAction.fromObject = function fromObject(object) {
        if (object instanceof $root.WorkingGroupMetadataAction)
            return object;
        var message = new $root.WorkingGroupMetadataAction();
        if (object.setGroupMetadata != null) {
            if (typeof object.setGroupMetadata !== "object")
                throw TypeError(".WorkingGroupMetadataAction.setGroupMetadata: object expected");
            message.setGroupMetadata = $root.SetGroupMetadata.fromObject(object.setGroupMetadata);
        }
        if (object.addUpcomingOpening != null) {
            if (typeof object.addUpcomingOpening !== "object")
                throw TypeError(".WorkingGroupMetadataAction.addUpcomingOpening: object expected");
            message.addUpcomingOpening = $root.AddUpcomingOpening.fromObject(object.addUpcomingOpening);
        }
        if (object.removeUpcomingOpening != null) {
            if (typeof object.removeUpcomingOpening !== "object")
                throw TypeError(".WorkingGroupMetadataAction.removeUpcomingOpening: object expected");
            message.removeUpcomingOpening = $root.RemoveUpcomingOpening.fromObject(object.removeUpcomingOpening);
        }
        return message;
    };

    /**
     * Creates a plain object from a WorkingGroupMetadataAction message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WorkingGroupMetadataAction
     * @static
     * @param {WorkingGroupMetadataAction} message WorkingGroupMetadataAction
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WorkingGroupMetadataAction.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (message.setGroupMetadata != null && message.hasOwnProperty("setGroupMetadata")) {
            object.setGroupMetadata = $root.SetGroupMetadata.toObject(message.setGroupMetadata, options);
            if (options.oneofs)
                object.action = "setGroupMetadata";
        }
        if (message.addUpcomingOpening != null && message.hasOwnProperty("addUpcomingOpening")) {
            object.addUpcomingOpening = $root.AddUpcomingOpening.toObject(message.addUpcomingOpening, options);
            if (options.oneofs)
                object.action = "addUpcomingOpening";
        }
        if (message.removeUpcomingOpening != null && message.hasOwnProperty("removeUpcomingOpening")) {
            object.removeUpcomingOpening = $root.RemoveUpcomingOpening.toObject(message.removeUpcomingOpening, options);
            if (options.oneofs)
                object.action = "removeUpcomingOpening";
        }
        return object;
    };

    /**
     * Converts this WorkingGroupMetadataAction to JSON.
     * @function toJSON
     * @memberof WorkingGroupMetadataAction
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WorkingGroupMetadataAction.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WorkingGroupMetadataAction;
})();

module.exports = $root;
