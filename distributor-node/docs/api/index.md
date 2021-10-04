---
title: Distributor node API v0.1.0
language_tabs:
  - javascript: JavaScript
  - shell: Shell
language_clients:
  - javascript: ""
  - shell: ""
toc_footers:
  - <a href="https://github.com/Joystream/joystream/issues/2224">Distributor
    node API</a>
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<h1 id="distributor-node-api">Distributor node API v0.1.0</h1>

> Scroll down for code samples, example requests and responses.

Distributor node API

Base URLs:

* <a href="http://localhost:3334/api/v1/">http://localhost:3334/api/v1/</a>

Email: <a href="mailto:info@joystream.org">Support</a> 
License: <a href="https://spdx.org/licenses/GPL-3.0-only.html">GPL-3.0-only</a>

<h1 id="distributor-node-api-public">public</h1>

Public distributor node API

## public.status

<a id="opIdpublic.status"></a>

> Code samples

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:3334/api/v1/status',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```shell
# You can also use wget
curl -X GET http://localhost:3334/api/v1/status \
  -H 'Accept: application/json'

```

`GET /status`

Returns json object describing current node status.

> Example responses

> 200 Response

```json
{
  "id": "string",
  "objectsInCache": 0,
  "storageLimit": 0,
  "storageUsed": 0,
  "uptime": 0,
  "downloadsInProgress": 0
}
```

<h3 id="public.status-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[StatusResponse](#schemastatusresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="success">
This operation does not require authentication
</aside>

## public.buckets

<a id="opIdpublic.buckets"></a>

> Code samples

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('http://localhost:3334/api/v1/buckets',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```shell
# You can also use wget
curl -X GET http://localhost:3334/api/v1/buckets \
  -H 'Accept: application/json'

```

`GET /buckets`

Returns list of distributed buckets

> Example responses

> 200 Response

```json
{
  "bucketIds": [
    0
  ]
}
```

<h3 id="public.buckets-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[BucketsResponse](#schemabucketsresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="success">
This operation does not require authentication
</aside>

## public.assetHead

<a id="opIdpublic.assetHead"></a>

> Code samples

```javascript

fetch('http://localhost:3334/api/v1/asset/{objectId}',
{
  method: 'HEAD'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```shell
# You can also use wget
curl -X HEAD http://localhost:3334/api/v1/asset/{objectId}

```

`HEAD /asset/{objectId}`

Returns asset response headers (cache status, content type and/or length, accepted ranges etc.)

<h3 id="public.assethead-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|objectId|path|string|true|Data Object ID|

<h3 id="public.assethead-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Object is supported and should be send on GET request.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Data object does not exist.|None|
|421|[Misdirected request](https://tools.ietf.org/html/rfc7540#section-9.1.2)|Misdirected request. Data object not supported by the node.|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

### Response Headers

|Status|Header|Type|Format|Description|
|---|---|---|---|---|
|200|X-Cache|string||Describes cache status of an object. Hit - object is already fully fetched in distributor node's cache. Pending - object is still beeing fetched from the storage node. Miss - object is neither in cache not currently beeing fetched. Fetching from storage node may be triggered.|

<aside class="success">
This operation does not require authentication
</aside>

## public.asset

<a id="opIdpublic.asset"></a>

> Code samples

```javascript

const headers = {
  'Accept':'image/*'
};

fetch('http://localhost:3334/api/v1/asset/{objectId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```shell
# You can also use wget
curl -X GET http://localhost:3334/api/v1/asset/{objectId} \
  -H 'Accept: image/*'

```

`GET /asset/{objectId}`

Returns a media file.

<h3 id="public.asset-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|objectId|path|string|true|Data Object ID|

> Example responses

> 200 Response

> 404 Response

```json
{
  "type": "string",
  "message": "string"
}
```

<h3 id="public.asset-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Full available object data sent|string|
|206|[Partial Content](https://tools.ietf.org/html/rfc7233#section-4.1)|Requested partial object data sent|string|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Data object does not exist.|[ErrorResponse](#schemaerrorresponse)|
|421|[Misdirected request](https://tools.ietf.org/html/rfc7540#section-9.1.2)|Misdirected request. Data object not supported.|[ErrorResponse](#schemaerrorresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

### Response Headers

|Status|Header|Type|Format|Description|
|---|---|---|---|---|
|200|X-Cache|string||Describes cache status of an object. Hit - object is already fully fetched in distributor node's cache. Pending - object is still beeing fetched from the storage node. Miss - object is neither in cache not currently beeing fetched. Fetching from storage node may be triggered.|
|200|X-Data-Source|string||Describes the source of data stream. External - the request was proxied to a storage node. Local - the data is streamed from local file.|
|206|X-Cache|string||Describes cache status of an object. Hit - object is already fully fetched in distributor node's cache. Pending - object is still beeing fetched from the storage node. Miss - object is neither in cache not currently beeing fetched. Fetching from storage node may be triggered.|
|206|X-Data-Source|string||Describes the source of data stream. External - the request was proxied to a storage node. Local - the data is streamed from local file.|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_ErrorResponse">ErrorResponse</h2>

<a id="schemaerrorresponse"></a>
<a id="schema_ErrorResponse"></a>
<a id="tocSerrorresponse"></a>
<a id="tocserrorresponse"></a>

```json
{
  "type": "string",
  "message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|false|none|none|
|message|string|true|none|none|

<h2 id="tocS_StatusResponse">StatusResponse</h2>

<a id="schemastatusresponse"></a>
<a id="schema_StatusResponse"></a>
<a id="tocSstatusresponse"></a>
<a id="tocsstatusresponse"></a>

```json
{
  "id": "string",
  "objectsInCache": 0,
  "storageLimit": 0,
  "storageUsed": 0,
  "uptime": 0,
  "downloadsInProgress": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|objectsInCache|integer|true|none|none|
|storageLimit|integer|true|none|none|
|storageUsed|integer|true|none|none|
|uptime|integer|true|none|none|
|downloadsInProgress|integer|true|none|none|

<h2 id="tocS_BucketsResponse">BucketsResponse</h2>

<a id="schemabucketsresponse"></a>
<a id="schema_BucketsResponse"></a>
<a id="tocSbucketsresponse"></a>
<a id="tocsbucketsresponse"></a>

```json
{
  "bucketIds": [
    0
  ]
}

```

### Properties

oneOf

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|object|false|none|none|
|» bucketIds|[integer]|true|none|none|

xor

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|object|false|none|none|
|» allByWorkerId|integer|true|none|none|

undefined

