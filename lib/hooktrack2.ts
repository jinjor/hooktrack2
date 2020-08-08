import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import cloudfront = require("@aws-cdk/aws-cloudfront");
import route53 = require("@aws-cdk/aws-route53");
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");

export interface StaticSiteProps {
  domainName: string;
  siteSubDomain: string;
}

export class Hooktrack2Service extends core.Construct {
  constructor(scope: core.Construct, id: string, props: StaticSiteProps) {
    super(scope, id);

    const table = new dynamodb.Table(this, "Hooktrack2Table", {
      partitionKey: {
        name: "key",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sort",
        type: dynamodb.AttributeType.STRING,
      },
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
      requestTemplates: {
        "application/json": '{ "statusCode": "200" }',
      },
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

    // WIP
    // https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site

    // const zone = route53.HostedZone.fromLookup(this, "Zone", {
    //   domainName: props.domainName,
    // });
    const siteDomain = props.siteSubDomain + "." + props.domainName;
    new core.CfnOutput(this, "Site", {
      value: "https://" + siteDomain,
    });

    // Content bucket
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: siteDomain,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      publicReadAccess: true,
      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
      removalPolicy: core.RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new core.CfnOutput(this, "Bucket", {
      value: siteBucket.bucketName,
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("./public")],
      destinationBucket: siteBucket,
      // distribution,
      // distributionPaths: ["/*"],
    });
  }
}
