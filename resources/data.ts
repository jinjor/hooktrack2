import { v4 as uuid } from "uuid";
import {
  Decoder,
  object,
  optional,
  number,
  string,
  keywords,
  dict,
  toNumber,
} from "./decoder";
import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB();
const lifeTime = 1 * 60 * 60 * 1000;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTION";
type Headers = { [key: string]: string };
interface Request {
  method: Method;
  headers: Headers;
  body: string;
}
interface Response {
  status: number | null;
  headers: Headers | null;
  body: string | null;
}
interface Endpoint {
  method: Method;
  response: Response | null;
}
interface Result {
  request: Request;
  requestedAt: number;
}

const methodDecoder: Decoder<Method> = keywords([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTION",
]);
const responseDecoder: Decoder<Response> = object({
  status: optional(number, 200),
  headers: optional(dict(string), {}),
  body: optional(string),
});
export const endpointDecoder: Decoder<Endpoint> = object({
  method: methodDecoder,
  response: optional(responseDecoder),
});
export const fromDecoder: Decoder<number | null> = optional(toNumber(string));

export interface Data {
  addEndPoint(endpoint: Endpoint): Promise<string>;
  addRequest(key: string, request: Request): Promise<Result>;
  getEndpoint(key: string): Promise<Endpoint | null>;
  getResults(key: string, from: number | null): Promise<Result[] | null>;
}

export function getData(tableName: string): Data {
  return new DataImpl(tableName);
}

class DataImpl implements Data {
  constructor(private tableName: string) {}
  async addEndPoint(endpoint: Endpoint): Promise<string> {
    const key: string = uuid();
    const ttl = Date.now() + lifeTime;
    const res = await dynamodb
      .putItem({
        TableName: this.tableName,
        Item: {
          key: { S: key },
          sort: { S: "method-" + endpoint.method },
          endpoint: { S: JSON.stringify(endpoint) },
          ttl: { N: String(ttl) },
        },
      })
      .promise();
    return key;
  }
  async addRequest(key: string, request: Request): Promise<Result> {
    const result = {
      key,
      request,
      requestedAt: Date.now(),
    };
    const ttl = Date.now() + lifeTime;
    const res = await dynamodb
      .putItem({
        TableName: this.tableName,
        Item: {
          key: { S: key },
          sort: { S: "result-" + result.requestedAt },
          result: { S: JSON.stringify(result) },
          requestedAt: { N: String(result.requestedAt) },
          ttl: { N: String(ttl) },
        },
      })
      .promise();
    return result;
  }
  async getEndpoint(key: string): Promise<Endpoint | null> {
    const res = await dynamodb
      .query({
        TableName: this.tableName,
        ExpressionAttributeNames: {
          "#key": "key",
        },
        ExpressionAttributeValues: {
          ":key": { S: key },
          ":sort": { S: "method-" },
        },
        KeyConditionExpression: "#key = :key and begins_with(sort, :sort)",
        ProjectionExpression: "endpoint",
      })
      .promise();
    if (res.Items == null || res.Items[0] == null) {
      return null;
    }
    const item = res.Items[0];
    return JSON.parse(item.endpoint.S!);
  }
  async getResults(key: string, from: number | null): Promise<Result[] | null> {
    if ((await this.getEndpoint(key)) == null) {
      return null;
    }
    const res = await dynamodb
      .query({
        TableName: this.tableName,
        ExpressionAttributeNames: {
          "#key": "key",
          "#result": "result",
        },
        ExpressionAttributeValues: {
          ":key": { S: key },
          ":from": { S: "result-" + (from ?? Date.now() - lifeTime) },
        },
        KeyConditionExpression: "#key = :key and sort >= :from",
        ProjectionExpression: "#result",
        ScanIndexForward: false,
      })
      .promise();
    if (res.Items == null) {
      return null;
    }
    return res.Items.map((Item) => {
      return JSON.parse(Item.result.S!);
    });
  }
}
