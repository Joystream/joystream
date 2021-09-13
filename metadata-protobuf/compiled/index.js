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

$root.GeoCoordiantes = (function() {

    /**
     * Properties of a GeoCoordiantes.
     * @exports IGeoCoordiantes
     * @interface IGeoCoordiantes
     * @property {number|null} [latitude] GeoCoordiantes latitude
     * @property {number|null} [longitude] GeoCoordiantes longitude
     */

    /**
     * Constructs a new GeoCoordiantes.
     * @exports GeoCoordiantes
     * @classdesc Represents a GeoCoordiantes.
     * @implements IGeoCoordiantes
     * @constructor
     * @param {IGeoCoordiantes=} [properties] Properties to set
     */
    function GeoCoordiantes(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GeoCoordiantes latitude.
     * @member {number} latitude
     * @memberof GeoCoordiantes
     * @instance
     */
    GeoCoordiantes.prototype.latitude = 0;

    /**
     * GeoCoordiantes longitude.
     * @member {number} longitude
     * @memberof GeoCoordiantes
     * @instance
     */
    GeoCoordiantes.prototype.longitude = 0;

    /**
     * Creates a new GeoCoordiantes instance using the specified properties.
     * @function create
     * @memberof GeoCoordiantes
     * @static
     * @param {IGeoCoordiantes=} [properties] Properties to set
     * @returns {GeoCoordiantes} GeoCoordiantes instance
     */
    GeoCoordiantes.create = function create(properties) {
        return new GeoCoordiantes(properties);
    };

    /**
     * Encodes the specified GeoCoordiantes message. Does not implicitly {@link GeoCoordiantes.verify|verify} messages.
     * @function encode
     * @memberof GeoCoordiantes
     * @static
     * @param {IGeoCoordiantes} message GeoCoordiantes message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GeoCoordiantes.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
            writer.uint32(/* id 3, wireType 5 =*/29).float(message.latitude);
        if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
            writer.uint32(/* id 4, wireType 5 =*/37).float(message.longitude);
        return writer;
    };

    /**
     * Encodes the specified GeoCoordiantes message, length delimited. Does not implicitly {@link GeoCoordiantes.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GeoCoordiantes
     * @static
     * @param {IGeoCoordiantes} message GeoCoordiantes message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GeoCoordiantes.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GeoCoordiantes message from the specified reader or buffer.
     * @function decode
     * @memberof GeoCoordiantes
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GeoCoordiantes} GeoCoordiantes
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GeoCoordiantes.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.GeoCoordiantes();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 3:
                message.latitude = reader.float();
                break;
            case 4:
                message.longitude = reader.float();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a GeoCoordiantes message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GeoCoordiantes
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GeoCoordiantes} GeoCoordiantes
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GeoCoordiantes.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GeoCoordiantes message.
     * @function verify
     * @memberof GeoCoordiantes
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GeoCoordiantes.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.latitude != null && message.hasOwnProperty("latitude"))
            if (typeof message.latitude !== "number")
                return "latitude: number expected";
        if (message.longitude != null && message.hasOwnProperty("longitude"))
            if (typeof message.longitude !== "number")
                return "longitude: number expected";
        return null;
    };

    /**
     * Creates a GeoCoordiantes message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GeoCoordiantes
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GeoCoordiantes} GeoCoordiantes
     */
    GeoCoordiantes.fromObject = function fromObject(object) {
        if (object instanceof $root.GeoCoordiantes)
            return object;
        var message = new $root.GeoCoordiantes();
        if (object.latitude != null)
            message.latitude = Number(object.latitude);
        if (object.longitude != null)
            message.longitude = Number(object.longitude);
        return message;
    };

    /**
     * Creates a plain object from a GeoCoordiantes message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GeoCoordiantes
     * @static
     * @param {GeoCoordiantes} message GeoCoordiantes
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GeoCoordiantes.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.latitude = 0;
            object.longitude = 0;
        }
        if (message.latitude != null && message.hasOwnProperty("latitude"))
            object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
        if (message.longitude != null && message.hasOwnProperty("longitude"))
            object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
        return object;
    };

    /**
     * Converts this GeoCoordiantes to JSON.
     * @function toJSON
     * @memberof GeoCoordiantes
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GeoCoordiantes.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return GeoCoordiantes;
})();

$root.NodeLocationMetadata = (function() {

    /**
     * Properties of a NodeLocationMetadata.
     * @exports INodeLocationMetadata
     * @interface INodeLocationMetadata
     * @property {string|null} [countryCode] NodeLocationMetadata countryCode
     * @property {string|null} [city] NodeLocationMetadata city
     * @property {IGeoCoordiantes|null} [coordinates] NodeLocationMetadata coordinates
     */

    /**
     * Constructs a new NodeLocationMetadata.
     * @exports NodeLocationMetadata
     * @classdesc Represents a NodeLocationMetadata.
     * @implements INodeLocationMetadata
     * @constructor
     * @param {INodeLocationMetadata=} [properties] Properties to set
     */
    function NodeLocationMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * NodeLocationMetadata countryCode.
     * @member {string} countryCode
     * @memberof NodeLocationMetadata
     * @instance
     */
    NodeLocationMetadata.prototype.countryCode = "";

    /**
     * NodeLocationMetadata city.
     * @member {string} city
     * @memberof NodeLocationMetadata
     * @instance
     */
    NodeLocationMetadata.prototype.city = "";

    /**
     * NodeLocationMetadata coordinates.
     * @member {IGeoCoordiantes|null|undefined} coordinates
     * @memberof NodeLocationMetadata
     * @instance
     */
    NodeLocationMetadata.prototype.coordinates = null;

    /**
     * Creates a new NodeLocationMetadata instance using the specified properties.
     * @function create
     * @memberof NodeLocationMetadata
     * @static
     * @param {INodeLocationMetadata=} [properties] Properties to set
     * @returns {NodeLocationMetadata} NodeLocationMetadata instance
     */
    NodeLocationMetadata.create = function create(properties) {
        return new NodeLocationMetadata(properties);
    };

    /**
     * Encodes the specified NodeLocationMetadata message. Does not implicitly {@link NodeLocationMetadata.verify|verify} messages.
     * @function encode
     * @memberof NodeLocationMetadata
     * @static
     * @param {INodeLocationMetadata} message NodeLocationMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NodeLocationMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.countryCode != null && Object.hasOwnProperty.call(message, "countryCode"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.countryCode);
        if (message.city != null && Object.hasOwnProperty.call(message, "city"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.city);
        if (message.coordinates != null && Object.hasOwnProperty.call(message, "coordinates"))
            $root.GeoCoordiantes.encode(message.coordinates, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified NodeLocationMetadata message, length delimited. Does not implicitly {@link NodeLocationMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof NodeLocationMetadata
     * @static
     * @param {INodeLocationMetadata} message NodeLocationMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NodeLocationMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NodeLocationMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof NodeLocationMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {NodeLocationMetadata} NodeLocationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NodeLocationMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.NodeLocationMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.countryCode = reader.string();
                break;
            case 2:
                message.city = reader.string();
                break;
            case 3:
                message.coordinates = $root.GeoCoordiantes.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a NodeLocationMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof NodeLocationMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {NodeLocationMetadata} NodeLocationMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NodeLocationMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NodeLocationMetadata message.
     * @function verify
     * @memberof NodeLocationMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NodeLocationMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            if (!$util.isString(message.countryCode))
                return "countryCode: string expected";
        if (message.city != null && message.hasOwnProperty("city"))
            if (!$util.isString(message.city))
                return "city: string expected";
        if (message.coordinates != null && message.hasOwnProperty("coordinates")) {
            var error = $root.GeoCoordiantes.verify(message.coordinates);
            if (error)
                return "coordinates." + error;
        }
        return null;
    };

    /**
     * Creates a NodeLocationMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof NodeLocationMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {NodeLocationMetadata} NodeLocationMetadata
     */
    NodeLocationMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.NodeLocationMetadata)
            return object;
        var message = new $root.NodeLocationMetadata();
        if (object.countryCode != null)
            message.countryCode = String(object.countryCode);
        if (object.city != null)
            message.city = String(object.city);
        if (object.coordinates != null) {
            if (typeof object.coordinates !== "object")
                throw TypeError(".NodeLocationMetadata.coordinates: object expected");
            message.coordinates = $root.GeoCoordiantes.fromObject(object.coordinates);
        }
        return message;
    };

    /**
     * Creates a plain object from a NodeLocationMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof NodeLocationMetadata
     * @static
     * @param {NodeLocationMetadata} message NodeLocationMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NodeLocationMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.countryCode = "";
            object.city = "";
            object.coordinates = null;
        }
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            object.countryCode = message.countryCode;
        if (message.city != null && message.hasOwnProperty("city"))
            object.city = message.city;
        if (message.coordinates != null && message.hasOwnProperty("coordinates"))
            object.coordinates = $root.GeoCoordiantes.toObject(message.coordinates, options);
        return object;
    };

    /**
     * Converts this NodeLocationMetadata to JSON.
     * @function toJSON
     * @memberof NodeLocationMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NodeLocationMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return NodeLocationMetadata;
})();

$root.StorageBucketOperatorMetadata = (function() {

    /**
     * Properties of a StorageBucketOperatorMetadata.
     * @exports IStorageBucketOperatorMetadata
     * @interface IStorageBucketOperatorMetadata
     * @property {string|null} [endpoint] StorageBucketOperatorMetadata endpoint
     * @property {INodeLocationMetadata|null} [location] StorageBucketOperatorMetadata location
     * @property {string|null} [extra] StorageBucketOperatorMetadata extra
     */

    /**
     * Constructs a new StorageBucketOperatorMetadata.
     * @exports StorageBucketOperatorMetadata
     * @classdesc Represents a StorageBucketOperatorMetadata.
     * @implements IStorageBucketOperatorMetadata
     * @constructor
     * @param {IStorageBucketOperatorMetadata=} [properties] Properties to set
     */
    function StorageBucketOperatorMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * StorageBucketOperatorMetadata endpoint.
     * @member {string} endpoint
     * @memberof StorageBucketOperatorMetadata
     * @instance
     */
    StorageBucketOperatorMetadata.prototype.endpoint = "";

    /**
     * StorageBucketOperatorMetadata location.
     * @member {INodeLocationMetadata|null|undefined} location
     * @memberof StorageBucketOperatorMetadata
     * @instance
     */
    StorageBucketOperatorMetadata.prototype.location = null;

    /**
     * StorageBucketOperatorMetadata extra.
     * @member {string} extra
     * @memberof StorageBucketOperatorMetadata
     * @instance
     */
    StorageBucketOperatorMetadata.prototype.extra = "";

    /**
     * Creates a new StorageBucketOperatorMetadata instance using the specified properties.
     * @function create
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {IStorageBucketOperatorMetadata=} [properties] Properties to set
     * @returns {StorageBucketOperatorMetadata} StorageBucketOperatorMetadata instance
     */
    StorageBucketOperatorMetadata.create = function create(properties) {
        return new StorageBucketOperatorMetadata(properties);
    };

    /**
     * Encodes the specified StorageBucketOperatorMetadata message. Does not implicitly {@link StorageBucketOperatorMetadata.verify|verify} messages.
     * @function encode
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {IStorageBucketOperatorMetadata} message StorageBucketOperatorMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StorageBucketOperatorMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.endpoint != null && Object.hasOwnProperty.call(message, "endpoint"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.endpoint);
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
            $root.NodeLocationMetadata.encode(message.location, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.extra != null && Object.hasOwnProperty.call(message, "extra"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.extra);
        return writer;
    };

    /**
     * Encodes the specified StorageBucketOperatorMetadata message, length delimited. Does not implicitly {@link StorageBucketOperatorMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {IStorageBucketOperatorMetadata} message StorageBucketOperatorMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StorageBucketOperatorMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a StorageBucketOperatorMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {StorageBucketOperatorMetadata} StorageBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StorageBucketOperatorMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.StorageBucketOperatorMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.endpoint = reader.string();
                break;
            case 2:
                message.location = $root.NodeLocationMetadata.decode(reader, reader.uint32());
                break;
            case 3:
                message.extra = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a StorageBucketOperatorMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {StorageBucketOperatorMetadata} StorageBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StorageBucketOperatorMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a StorageBucketOperatorMetadata message.
     * @function verify
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    StorageBucketOperatorMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.endpoint != null && message.hasOwnProperty("endpoint"))
            if (!$util.isString(message.endpoint))
                return "endpoint: string expected";
        if (message.location != null && message.hasOwnProperty("location")) {
            var error = $root.NodeLocationMetadata.verify(message.location);
            if (error)
                return "location." + error;
        }
        if (message.extra != null && message.hasOwnProperty("extra"))
            if (!$util.isString(message.extra))
                return "extra: string expected";
        return null;
    };

    /**
     * Creates a StorageBucketOperatorMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {StorageBucketOperatorMetadata} StorageBucketOperatorMetadata
     */
    StorageBucketOperatorMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.StorageBucketOperatorMetadata)
            return object;
        var message = new $root.StorageBucketOperatorMetadata();
        if (object.endpoint != null)
            message.endpoint = String(object.endpoint);
        if (object.location != null) {
            if (typeof object.location !== "object")
                throw TypeError(".StorageBucketOperatorMetadata.location: object expected");
            message.location = $root.NodeLocationMetadata.fromObject(object.location);
        }
        if (object.extra != null)
            message.extra = String(object.extra);
        return message;
    };

    /**
     * Creates a plain object from a StorageBucketOperatorMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof StorageBucketOperatorMetadata
     * @static
     * @param {StorageBucketOperatorMetadata} message StorageBucketOperatorMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    StorageBucketOperatorMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.endpoint = "";
            object.location = null;
            object.extra = "";
        }
        if (message.endpoint != null && message.hasOwnProperty("endpoint"))
            object.endpoint = message.endpoint;
        if (message.location != null && message.hasOwnProperty("location"))
            object.location = $root.NodeLocationMetadata.toObject(message.location, options);
        if (message.extra != null && message.hasOwnProperty("extra"))
            object.extra = message.extra;
        return object;
    };

    /**
     * Converts this StorageBucketOperatorMetadata to JSON.
     * @function toJSON
     * @memberof StorageBucketOperatorMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    StorageBucketOperatorMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return StorageBucketOperatorMetadata;
})();

$root.DistributionBucketOperatorMetadata = (function() {

    /**
     * Properties of a DistributionBucketOperatorMetadata.
     * @exports IDistributionBucketOperatorMetadata
     * @interface IDistributionBucketOperatorMetadata
     * @property {string|null} [endpoint] DistributionBucketOperatorMetadata endpoint
     * @property {INodeLocationMetadata|null} [location] DistributionBucketOperatorMetadata location
     * @property {string|null} [extra] DistributionBucketOperatorMetadata extra
     */

    /**
     * Constructs a new DistributionBucketOperatorMetadata.
     * @exports DistributionBucketOperatorMetadata
     * @classdesc Represents a DistributionBucketOperatorMetadata.
     * @implements IDistributionBucketOperatorMetadata
     * @constructor
     * @param {IDistributionBucketOperatorMetadata=} [properties] Properties to set
     */
    function DistributionBucketOperatorMetadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * DistributionBucketOperatorMetadata endpoint.
     * @member {string} endpoint
     * @memberof DistributionBucketOperatorMetadata
     * @instance
     */
    DistributionBucketOperatorMetadata.prototype.endpoint = "";

    /**
     * DistributionBucketOperatorMetadata location.
     * @member {INodeLocationMetadata|null|undefined} location
     * @memberof DistributionBucketOperatorMetadata
     * @instance
     */
    DistributionBucketOperatorMetadata.prototype.location = null;

    /**
     * DistributionBucketOperatorMetadata extra.
     * @member {string} extra
     * @memberof DistributionBucketOperatorMetadata
     * @instance
     */
    DistributionBucketOperatorMetadata.prototype.extra = "";

    /**
     * Creates a new DistributionBucketOperatorMetadata instance using the specified properties.
     * @function create
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {IDistributionBucketOperatorMetadata=} [properties] Properties to set
     * @returns {DistributionBucketOperatorMetadata} DistributionBucketOperatorMetadata instance
     */
    DistributionBucketOperatorMetadata.create = function create(properties) {
        return new DistributionBucketOperatorMetadata(properties);
    };

    /**
     * Encodes the specified DistributionBucketOperatorMetadata message. Does not implicitly {@link DistributionBucketOperatorMetadata.verify|verify} messages.
     * @function encode
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {IDistributionBucketOperatorMetadata} message DistributionBucketOperatorMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DistributionBucketOperatorMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.endpoint != null && Object.hasOwnProperty.call(message, "endpoint"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.endpoint);
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
            $root.NodeLocationMetadata.encode(message.location, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.extra != null && Object.hasOwnProperty.call(message, "extra"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.extra);
        return writer;
    };

    /**
     * Encodes the specified DistributionBucketOperatorMetadata message, length delimited. Does not implicitly {@link DistributionBucketOperatorMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {IDistributionBucketOperatorMetadata} message DistributionBucketOperatorMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DistributionBucketOperatorMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DistributionBucketOperatorMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {DistributionBucketOperatorMetadata} DistributionBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DistributionBucketOperatorMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.DistributionBucketOperatorMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.endpoint = reader.string();
                break;
            case 2:
                message.location = $root.NodeLocationMetadata.decode(reader, reader.uint32());
                break;
            case 3:
                message.extra = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a DistributionBucketOperatorMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {DistributionBucketOperatorMetadata} DistributionBucketOperatorMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DistributionBucketOperatorMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DistributionBucketOperatorMetadata message.
     * @function verify
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DistributionBucketOperatorMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.endpoint != null && message.hasOwnProperty("endpoint"))
            if (!$util.isString(message.endpoint))
                return "endpoint: string expected";
        if (message.location != null && message.hasOwnProperty("location")) {
            var error = $root.NodeLocationMetadata.verify(message.location);
            if (error)
                return "location." + error;
        }
        if (message.extra != null && message.hasOwnProperty("extra"))
            if (!$util.isString(message.extra))
                return "extra: string expected";
        return null;
    };

    /**
     * Creates a DistributionBucketOperatorMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {DistributionBucketOperatorMetadata} DistributionBucketOperatorMetadata
     */
    DistributionBucketOperatorMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.DistributionBucketOperatorMetadata)
            return object;
        var message = new $root.DistributionBucketOperatorMetadata();
        if (object.endpoint != null)
            message.endpoint = String(object.endpoint);
        if (object.location != null) {
            if (typeof object.location !== "object")
                throw TypeError(".DistributionBucketOperatorMetadata.location: object expected");
            message.location = $root.NodeLocationMetadata.fromObject(object.location);
        }
        if (object.extra != null)
            message.extra = String(object.extra);
        return message;
    };

    /**
     * Creates a plain object from a DistributionBucketOperatorMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof DistributionBucketOperatorMetadata
     * @static
     * @param {DistributionBucketOperatorMetadata} message DistributionBucketOperatorMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DistributionBucketOperatorMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.endpoint = "";
            object.location = null;
            object.extra = "";
        }
        if (message.endpoint != null && message.hasOwnProperty("endpoint"))
            object.endpoint = message.endpoint;
        if (message.location != null && message.hasOwnProperty("location"))
            object.location = $root.NodeLocationMetadata.toObject(message.location, options);
        if (message.extra != null && message.hasOwnProperty("extra"))
            object.extra = message.extra;
        return object;
    };

    /**
     * Converts this DistributionBucketOperatorMetadata to JSON.
     * @function toJSON
     * @memberof DistributionBucketOperatorMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DistributionBucketOperatorMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return DistributionBucketOperatorMetadata;
})();

$root.DistributionBucketFamilyMetadata = (function() {

    /**
     * Properties of a DistributionBucketFamilyMetadata.
     * @exports IDistributionBucketFamilyMetadata
     * @interface IDistributionBucketFamilyMetadata
     * @property {string|null} [region] DistributionBucketFamilyMetadata region
     * @property {string|null} [description] DistributionBucketFamilyMetadata description
     * @property {Array.<IGeoCoordiantes>|null} [boundary] DistributionBucketFamilyMetadata boundary
     */

    /**
     * Constructs a new DistributionBucketFamilyMetadata.
     * @exports DistributionBucketFamilyMetadata
     * @classdesc Represents a DistributionBucketFamilyMetadata.
     * @implements IDistributionBucketFamilyMetadata
     * @constructor
     * @param {IDistributionBucketFamilyMetadata=} [properties] Properties to set
     */
    function DistributionBucketFamilyMetadata(properties) {
        this.boundary = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * DistributionBucketFamilyMetadata region.
     * @member {string} region
     * @memberof DistributionBucketFamilyMetadata
     * @instance
     */
    DistributionBucketFamilyMetadata.prototype.region = "";

    /**
     * DistributionBucketFamilyMetadata description.
     * @member {string} description
     * @memberof DistributionBucketFamilyMetadata
     * @instance
     */
    DistributionBucketFamilyMetadata.prototype.description = "";

    /**
     * DistributionBucketFamilyMetadata boundary.
     * @member {Array.<IGeoCoordiantes>} boundary
     * @memberof DistributionBucketFamilyMetadata
     * @instance
     */
    DistributionBucketFamilyMetadata.prototype.boundary = $util.emptyArray;

    /**
     * Creates a new DistributionBucketFamilyMetadata instance using the specified properties.
     * @function create
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {IDistributionBucketFamilyMetadata=} [properties] Properties to set
     * @returns {DistributionBucketFamilyMetadata} DistributionBucketFamilyMetadata instance
     */
    DistributionBucketFamilyMetadata.create = function create(properties) {
        return new DistributionBucketFamilyMetadata(properties);
    };

    /**
     * Encodes the specified DistributionBucketFamilyMetadata message. Does not implicitly {@link DistributionBucketFamilyMetadata.verify|verify} messages.
     * @function encode
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {IDistributionBucketFamilyMetadata} message DistributionBucketFamilyMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DistributionBucketFamilyMetadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.region != null && Object.hasOwnProperty.call(message, "region"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.region);
        if (message.description != null && Object.hasOwnProperty.call(message, "description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.boundary != null && message.boundary.length)
            for (var i = 0; i < message.boundary.length; ++i)
                $root.GeoCoordiantes.encode(message.boundary[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified DistributionBucketFamilyMetadata message, length delimited. Does not implicitly {@link DistributionBucketFamilyMetadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {IDistributionBucketFamilyMetadata} message DistributionBucketFamilyMetadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DistributionBucketFamilyMetadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DistributionBucketFamilyMetadata message from the specified reader or buffer.
     * @function decode
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {DistributionBucketFamilyMetadata} DistributionBucketFamilyMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DistributionBucketFamilyMetadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.DistributionBucketFamilyMetadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.region = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                if (!(message.boundary && message.boundary.length))
                    message.boundary = [];
                message.boundary.push($root.GeoCoordiantes.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a DistributionBucketFamilyMetadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {DistributionBucketFamilyMetadata} DistributionBucketFamilyMetadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DistributionBucketFamilyMetadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DistributionBucketFamilyMetadata message.
     * @function verify
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DistributionBucketFamilyMetadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.region != null && message.hasOwnProperty("region"))
            if (!$util.isString(message.region))
                return "region: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.boundary != null && message.hasOwnProperty("boundary")) {
            if (!Array.isArray(message.boundary))
                return "boundary: array expected";
            for (var i = 0; i < message.boundary.length; ++i) {
                var error = $root.GeoCoordiantes.verify(message.boundary[i]);
                if (error)
                    return "boundary." + error;
            }
        }
        return null;
    };

    /**
     * Creates a DistributionBucketFamilyMetadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {DistributionBucketFamilyMetadata} DistributionBucketFamilyMetadata
     */
    DistributionBucketFamilyMetadata.fromObject = function fromObject(object) {
        if (object instanceof $root.DistributionBucketFamilyMetadata)
            return object;
        var message = new $root.DistributionBucketFamilyMetadata();
        if (object.region != null)
            message.region = String(object.region);
        if (object.description != null)
            message.description = String(object.description);
        if (object.boundary) {
            if (!Array.isArray(object.boundary))
                throw TypeError(".DistributionBucketFamilyMetadata.boundary: array expected");
            message.boundary = [];
            for (var i = 0; i < object.boundary.length; ++i) {
                if (typeof object.boundary[i] !== "object")
                    throw TypeError(".DistributionBucketFamilyMetadata.boundary: object expected");
                message.boundary[i] = $root.GeoCoordiantes.fromObject(object.boundary[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a DistributionBucketFamilyMetadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof DistributionBucketFamilyMetadata
     * @static
     * @param {DistributionBucketFamilyMetadata} message DistributionBucketFamilyMetadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DistributionBucketFamilyMetadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.boundary = [];
        if (options.defaults) {
            object.region = "";
            object.description = "";
        }
        if (message.region != null && message.hasOwnProperty("region"))
            object.region = message.region;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.boundary && message.boundary.length) {
            object.boundary = [];
            for (var j = 0; j < message.boundary.length; ++j)
                object.boundary[j] = $root.GeoCoordiantes.toObject(message.boundary[j], options);
        }
        return object;
    };

    /**
     * Converts this DistributionBucketFamilyMetadata to JSON.
     * @function toJSON
     * @memberof DistributionBucketFamilyMetadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DistributionBucketFamilyMetadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return DistributionBucketFamilyMetadata;
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

module.exports = $root;
