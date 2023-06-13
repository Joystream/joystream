## otlp Type

`object` ([Details](definition-properties-otlp.md))

# otlp Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                                                                |
| :------------------------ | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [endpoint](#endpoint)     | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-otlp-properties-endpoint.md "https://joystream.org/schemas/argus/config#/properties/otlp/properties/endpoint")     |
| [attributes](#attributes) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-otlp-properties-attributes.md "https://joystream.org/schemas/argus/config#/properties/otlp/properties/attributes") |

## endpoint

OTLP Agent (APM Server) URL. The host and port that APM Server listens on

`endpoint`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-otlp-properties-endpoint.md "https://joystream.org/schemas/argus/config#/properties/otlp/properties/endpoint")

### endpoint Type

`string`

### endpoint Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")

## attributes

Comma separated list of (key=value) paris describing the service and the environment

`attributes`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-otlp-properties-attributes.md "https://joystream.org/schemas/argus/config#/properties/otlp/properties/attributes")

### attributes Type

`string`
