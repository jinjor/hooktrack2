import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

export class Hooktrack2Service extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const table = new dynamodb.Table(this, "Hooktrack2Table", {
      partitionKey: { name: "key", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sort", type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "ttl",
    });

    const handler = new lambda.Function(this, "Hooktrack2Handler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset("resources"),
      handler: "api.main",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(handler);

    const restApi = new apigateway.RestApi(this, "Hooktrack2API", {
      restApiName: "Hooktrack2 API",
      description: "Define REST API and track the requests.",
    });

    const apiIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });
    const api = restApi.root.addResource("api");
    const endpoints = api.addResource("endpoints");
    const endpointsId = endpoints.addResource("{id}");
    const endpointsIdResults = endpointsId.addResource("results");
    endpoints.addMethod("POST", apiIntegration);
    endpointsIdResults.addMethod("GET", apiIntegration);

    const userApi = api.addResource("{key}");

    userApi.addMethod("GET", apiIntegration);
    userApi.addMethod("POST", apiIntegration);
    userApi.addMethod("PUT", apiIntegration);
    userApi.addMethod("PATCH", apiIntegration);
    userApi.addMethod("DELETE", apiIntegration);
  }
}
