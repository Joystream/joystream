## 0 Type

`object` ([Substrate uri](definition-properties-keys-items-oneof-substrate-uri.md))

# 0 Properties

| Property      | Type     | Required | Nullable       | Defined by                                                                                                                                                                                            |
| :------------ | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type) | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-keys-items-oneof-substrate-uri-properties-type.md "https://joystream.org/schemas/argus/config#/properties/keys/items/oneOf/0/properties/type") |
| [suri](#suri) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-keys-items-oneof-substrate-uri-properties-suri.md "https://joystream.org/schemas/argus/config#/properties/keys/items/oneOf/0/properties/suri") |

## type



`type`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-keys-items-oneof-substrate-uri-properties-type.md "https://joystream.org/schemas/argus/config#/properties/keys/items/oneOf/0/properties/type")

### type Type

`string`

### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | :---------- |
| `"ed25519"` |             |
| `"sr25519"` |             |
| `"ecdsa"`   |             |

### type Default Value

The default value is:

```json
"sr25519"
```

## suri



`suri`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-keys-items-oneof-substrate-uri-properties-suri.md "https://joystream.org/schemas/argus/config#/properties/keys/items/oneOf/0/properties/suri")

### suri Type

`string`
