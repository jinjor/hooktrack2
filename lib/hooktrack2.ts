import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as iam from "@aws-cdk/aws-iam";

export interface Props {
  region: string;
  urlSuffix: string;
}

export class Hooktrack2Service extends core.Construct {
  constructor(scope: core.Construct, id: string, props: Props) {
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
      code: lambda.Code.asset("lambda"),
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

    const siteBucket = new s3.Bucket(this, "Hooktrack2Bucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      removalPolicy: core.RemovalPolicy.DESTROY,
    });
    new core.CfnOutput(this, "Bucket", {
      value: siteBucket.bucketName,
    });

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "Hooktrack2OAI",
      {
        comment: `OAI for Hooktrack2OAI`,
      }
    );
    const cloudfrontS3Access = new iam.PolicyStatement();
    cloudfrontS3Access.addActions("s3:GetObject*");
    cloudfrontS3Access.addResources(siteBucket.bucketArn);
    cloudfrontS3Access.addResources(`${siteBucket.bucketArn}/*`);
    cloudfrontS3Access.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );
    const cloudfrontDist = new cloudfront.CloudFrontWebDistribution(
      this,
      `Hooktrack2Distribution`,
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
              originAccessIdentity: cloudFrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
          {
            customOriginSource: {
              domainName: `${restApi.restApiId}.execute-api.${props.region}.${props.urlSuffix}`,
            },
            originPath: `/${restApi.deploymentStage.stageName}`,
            behaviors: [
              {
                pathPattern: "/api/*",
                allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
                // TODO: deprecated, should use origin request policy instead
                forwardedValues: {
                  queryString: true,
                  headers: ["User-Agent"],
                },
                minTtl: core.Duration.seconds(0),
                maxTtl: core.Duration.seconds(0),
                defaultTtl: core.Duration.seconds(0),
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 403,
            responseCode: 404,
            responsePagePath: "/404.html",
          },
        ],
      }
    );

    new core.CfnOutput(this, "URL", {
      value: `https://${cloudfrontDist.domainName}/`,
    });

    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("./front/dist")],
      destinationBucket: siteBucket,
      distribution: cloudfrontDist,
      distributionPaths: ["/*"],
      retainOnDelete: false,
    });
  }
}
