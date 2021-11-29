---
title: Distributor node operator API v0.1.0
language_tabs:
  - javascript: JavaScript
  - shell: Shell
language_clients:
  - javascript: ""
  - shell: ""
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
<!-- AUTO-GENERATED-CONTENT:END -->

<h1 id="distributor-node-operator-api">Distributor node operator API v0.1.0</h1>

> Scroll down for code samples, example requests and responses.

Distributor node operator API

Base URLs:

* <a href="http://localhost:3335/api/v1/">http://localhost:3335/api/v1/</a>

Email: <a href="mailto:info@joystream.org">Support</a> 
License: <a href="https://spdx.org/licenses/GPL-3.0-only.html">GPL-3.0-only</a>

undefined

<h1 id="distributor-node-operator-api-default">Default</h1>

## operator.stopApi

<a id="opIdoperator.stopApi"></a>

> Code samples

```javascript

const headers = {
  'Authorization':'Bearer {access-token}'
};

fetch('http://localhost:3335/api/v1/stop-api',
{
  method: 'POST',

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
curl -X POST http://localhost:3335/api/v1/stop-api \
  -H 'Authorization: Bearer {access-token}'

```

`POST /stop-api`

Turns off the public api.

<h3 id="operator.stopapi-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Not authorized|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Already stopped|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
OperatorAuth
</aside>

## operator.startApi

<a id="opIdoperator.startApi"></a>

> Code samples

```javascript

const headers = {
  'Authorization':'Bearer {access-token}'
};

fetch('http://localhost:3335/api/v1/start-api',
{
  method: 'POST',

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
curl -X POST http://localhost:3335/api/v1/start-api \
  -H 'Authorization: Bearer {access-token}'

```

`POST /start-api`

Turns on the public api.

<h3 id="operator.startapi-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Not authorized|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Already started|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
OperatorAuth
</aside>

## operator.shutdown

<a id="opIdoperator.shutdown"></a>

> Code samples

```javascript

const headers = {
  'Authorization':'Bearer {access-token}'
};

fetch('http://localhost:3335/api/v1/shutdown',
{
  method: 'POST',

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
curl -X POST http://localhost:3335/api/v1/shutdown \
  -H 'Authorization: Bearer {access-token}'

```

`POST /shutdown`

Shuts down the node.

<h3 id="operator.shutdown-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Not authorized|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Already shutting down|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
OperatorAuth
</aside>

## operator.setWorker

<a id="opIdoperator.setWorker"></a>

> Code samples

```javascript
const inputBody = '{
  "workerId": 0
}';
const headers = {
  'Content-Type':'application/json',
  'Authorization':'Bearer {access-token}'
};

fetch('http://localhost:3335/api/v1/set-worker',
{
  method: 'POST',
  body: inputBody,
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
curl -X POST http://localhost:3335/api/v1/set-worker \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /set-worker`

Updates the operator worker id.

> Body parameter

```json
{
  "workerId": 0
}
```

<h3 id="operator.setworker-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[SetWorkerOperation](#schemasetworkeroperation)|false|none|

<h3 id="operator.setworker-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Not authorized|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
OperatorAuth
</aside>

## operator.setBuckets

<a id="opIdoperator.setBuckets"></a>

> Code samples

```javascript
const inputBody = '{
  "buckets": [
    0
  ]
}';
const headers = {
  'Content-Type':'application/json',
  'Authorization':'Bearer {access-token}'
};

fetch('http://localhost:3335/api/v1/set-buckets',
{
  method: 'POST',
  body: inputBody,
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
curl -X POST http://localhost:3335/api/v1/set-buckets \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /set-buckets`

Updates buckets supported by the node.

> Body parameter

```json
{
  "buckets": [
    0
  ]
}
```

<h3 id="operator.setbuckets-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[SetBucketsOperation](#schemasetbucketsoperation)|false|none|

<h3 id="operator.setbuckets-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|None|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Not authorized|None|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Unexpected server error|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
OperatorAuth
</aside>

# Schemas

<h2 id="tocS_SetWorkerOperation">SetWorkerOperation</h2>

<a id="schemasetworkeroperation"></a>
<a id="schema_SetWorkerOperation"></a>
<a id="tocSsetworkeroperation"></a>
<a id="tocssetworkeroperation"></a>

```json
{
  "workerId": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|workerId|integer|true|none|none|

<h2 id="tocS_SetBucketsOperation">SetBucketsOperation</h2>

<a id="schemasetbucketsoperation"></a>
<a id="schema_SetBucketsOperation"></a>
<a id="tocSsetbucketsoperation"></a>
<a id="tocssetbucketsoperation"></a>

```json
{
  "buckets": [
    0
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|buckets|[integer]|false|none|Set of bucket ids to be distributed by the node. If not provided - all buckets assigned to currently configured worker will be distributed.|

undefined

