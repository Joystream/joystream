## operatorApi Type

`object` ([Details](definition-properties-operatorapi.md))

# operatorApi Properties

| Property                  | Type      | Required | Nullable       | Defined by                                                                                                                                                                              |
| :------------------------ | :-------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [port](#port)             | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-operatorapi-properties-port.md "https://joystream.org/schemas/argus/config#/properties/operatorApi/properties/port")             |
| [hmacSecret](#hmacsecret) | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-operatorapi-properties-hmacsecret.md "https://joystream.org/schemas/argus/config#/properties/operatorApi/properties/hmacSecret") |

## port

Distributor node operator api port

`port`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-operatorapi-properties-port.md "https://joystream.org/schemas/argus/config#/properties/operatorApi/properties/port")

### port Type

`integer`

### port Constraints

**minimum**: the value of this number must greater than or equal to: `0`

## hmacSecret

HMAC (HS256) secret key used for JWT authorization

`hmacSecret`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-operatorapi-properties-hmacsecret.md "https://joystream.org/schemas/argus/config#/properties/operatorApi/properties/hmacSecret")

### hmacSecret Type

`string`
