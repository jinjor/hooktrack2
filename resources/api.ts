import { getData, endpointDecoder, fromDecoder } from "./data";
import * as lambda from "aws-lambda";
import { Decoder } from "./decoder";

const tableName: string = process.env.TABLE_NAME!;

const data = getData(tableName);

const handler: lambda.APIGatewayProxyHandler = async (
  event: lambda.APIGatewayProxyEvent,
  context: lambda.Context
) => {
  try {
    console.log("event", event);
    const method = event.httpMethod;
    const path = trimPath(event.path);
    const headers = getNormalizedHeaders(event.headers);
    const body = parseJson(event.body);

    let matched: string[] | null = [];
    if (method === "POST" && path === "/endpoints") {
      console.log("branch 1");
      const endpoint = decode(endpointDecoder, body);
      const key = await data.addEndPoint(endpoint);
      return sendJson(200, { key });
    } else if (
      method === "GET" &&
      (matched = /^\/endpoints\/([^/]+)\/results/.exec(path))
    ) {
      console.log("branch 2");
      const key = matched[1];
      const from = decode(fromDecoder, event.queryStringParameters?.from);
      const results = await data.getResults(key, from);
      if (!results) {
        throw new StatusError(404, "endpoint not found");
      }
      return sendJson(200, {
        items: results,
      });
    } else if ((matched = /^\/([^/]+)/.exec(path))) {
      console.log("branch 3");
      const key = matched[1];
      const endpoint = await data.getEndpoint(key);
      if (endpoint && endpoint.method === method) {
        const request = {
          method,
          headers,
          body,
        };
        await data.addRequest(key, request);
        console.log("endpoint.response", endpoint.response);
        return {
          statusCode: endpoint.response!.status!,
          headers: endpoint.response!.headers!,
          body: endpoint.response!.body!,
        };
      }
      // fall through
    }
    throw new StatusError(404, "path not found");
  } catch (e) {
    if (e instanceof StatusError) {
      return sendJson(e.code, {
        message: e.message,
      });
    }
    console.log("unhandled", e);
    return sendJson(500, {
      // message: "unexpected error",
      message: e.message,
    });
  }
};
function decode<T>(decoder: Decoder<T>, value: unknown): T {
  try {
    return decoder.run(value);
  } catch (e) {
    throw new StatusError(400, e.message);
  }
}
function trimPath(path: string): string {
  return path.replace(/(^\/api)/, "");
}
function getNormalizedHeaders(headers: { [name: string]: string }) {
  const ret: { [name: string]: string } = {};
  for (const key of Object.keys(headers)) {
    ret[key.toLowerCase()] = headers[key];
  }
  return ret;
}
function parseJson(body: string | null): any {
  try {
    return body && typeof body === "string" ? JSON.parse(body) : null;
  } catch (e) {
    throw new StatusError(400, "Only JSON body is supported for now: " + body);
  }
}
function sendJson(statusCode: number, body: any): lambda.APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}
class StatusError {
  constructor(public code: number, public message: string) {}
}

exports.main = handler;
