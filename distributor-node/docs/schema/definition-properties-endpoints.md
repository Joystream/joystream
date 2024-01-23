## endpoints Type

`object` ([Details](definition-properties-endpoints.md))

# endpoints Properties

| Property                            | Type     | Required | Nullable       | Defined by                                                                                                                                                                                    |
| :---------------------------------- | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [storageSquid](#storagesquid)       | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-storagesquid.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/storageSquid")       |
| [joystreamNodeWs](#joystreamnodews) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/joystreamNodeWs") |

## storageSquid

Storage-Squid graphql server uri (for example: <http://localhost:4352/graphql>)

`storageSquid`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-storagesquid.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/storageSquid")

### storageSquid Type

`string`

### storageSquid Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")

## joystreamNodeWs

Joystream node websocket api uri (for example: ws\://localhost:9944)

`joystreamNodeWs`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/joystreamNodeWs")

### joystreamNodeWs Type

`string`

### joystreamNodeWs Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")
