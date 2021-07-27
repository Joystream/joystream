/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.GeoCoordiantes = (function() {

    /**
     * Properties of a GeoCoordiantes.
     * @exports IGeoCoordiantes
     * @interface IGeoCoordiantes
     * @property {number} latitude GeoCoordiantes latitude
     * @property {number} longitude GeoCoordiantes longitude
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
        writer.uint32(/* id 3, wireType 5 =*/29).float(message.latitude);
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
        if (!message.hasOwnProperty("latitude"))
            throw $util.ProtocolError("missing required 'latitude'", { instance: message });
        if (!message.hasOwnProperty("longitude"))
            throw $util.ProtocolError("missing required 'longitude'", { instance: message });
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
        if (typeof message.latitude !== "number")
            return "latitude: number expected";
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

module.exports = $root;
