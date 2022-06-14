## endpoints Type

`object` ([Details](definition-properties-endpoints.md))

# endpoints Properties

| Property                            | Type     | Required | Nullable       | Defined by                                                                                                                                                                                    |
| :---------------------------------- | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [queryNode](#querynode)             | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-querynode.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/queryNode")             |
| [joystreamNodeWs](#joystreamnodews) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/joystreamNodeWs") |

## queryNode

Query node graphql server uri (for example: <http://localhost:8081/graphql>)

`queryNode`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-querynode.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/queryNode")

### queryNode Type

`string`

## joystreamNodeWs

Joystream node websocket api uri (for example: ws\://localhost:9944)

`joystreamNodeWs`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "https://joystream.org/schemas/argus/config#/properties/endpoints/properties/joystreamNodeWs")

### joystreamNodeWs Type

`string`
