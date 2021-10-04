## endpoints Type

`object` ([Details](definition-properties-endpoints.md))

# endpoints Properties

| Property                            | Type     | Required | Nullable       | Defined by                                                                                                                                                   |
| :---------------------------------- | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [queryNode](#querynode)             | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-querynode.md "undefined#/properties/endpoints/properties/queryNode")             |
| [joystreamNodeWs](#joystreamnodews) | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "undefined#/properties/endpoints/properties/joystreamNodeWs") |
| [elasticSearch](#elasticsearch)     | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-endpoints-properties-elasticsearch.md "undefined#/properties/endpoints/properties/elasticSearch")     |

## queryNode

Query node graphql server uri (for example: <http://localhost:8081/graphql>)

`queryNode`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-querynode.md "undefined#/properties/endpoints/properties/queryNode")

### queryNode Type

`string`

## joystreamNodeWs

Joystream node websocket api uri (for example: ws\://localhost:9944)

`joystreamNodeWs`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-joystreamnodews.md "undefined#/properties/endpoints/properties/joystreamNodeWs")

### joystreamNodeWs Type

`string`

## elasticSearch

Elasticsearch uri used for submitting the distributor node logs (if enabled via `log.elastic`)

`elasticSearch`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints-properties-elasticsearch.md "undefined#/properties/endpoints/properties/elasticSearch")

### elasticSearch Type

`string`
