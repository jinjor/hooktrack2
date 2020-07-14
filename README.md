# Hooktrack2

<!-- [![Build Status](https://travis-ci.org/jinjor/hooktrack2.svg)](https://travis-ci.org/jinjor/hooktrack2) -->

Define REST API and track the requests.

## Example

Custom domain is not configured for now. It is recommended to use a variable to point API root.

```
API_ROOT=https://lmzaqh61t1.execute-api.ap-northeast-1.amazonaws.com/prod/api
```

Add an endpoint.

```shell
$ curl -s -X POST -H "Content-Type: application/json" -d '{ "method":"GET", "response":{"body":"Hello!"} }' $API_ROOT/endpoints
{"key":"ca5aea78-9c5d-4032-8829-ad7e90ad91e9"}
```

Call it.

```shell
$ curl $API_ROOT/ca5aea78-9c5d-4032-8829-ad7e90ad91e9
Hello!
```

See the result.

```shell
$ curl $API_ROOT/endpoints/ca5aea78-9c5d-4032-8829-ad7e90ad91e9/results
{"items":[{"request":{"method":"GET","headers":{ ... },"body":{}},"requestedAt":1594710674167}]}
```
