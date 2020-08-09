import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import cloudfront = require("@aws-cdk/aws-cloudfront");
import route53 = require("@aws-cdk/aws-route53");
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import * as iam from "@aws-cdk/aws-iam";

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

    // const zone = route53.HostedZone.fromLookup(this, "Zone", {
    //   domainName: props.domainName,
    // });
    const siteDomain = props.siteSubDomain + "." + props.domainName;
    new core.CfnOutput(this, "Site", {
      value: "https://" + siteDomain,
    });

    // Content bucket
    const siteBucket = new s3.Bucket(this, "Hooktrack2Bucket", {
      // bucketName: siteDomain,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      // publicReadAccess: true,
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
    // cloudfrontS3Access.addActions("s3:GetBucket*");
    cloudfrontS3Access.addActions("s3:GetObject*");
    // cloudfrontS3Access.addActions("s3:List*");
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
        ],
      }
    );

    new core.CfnOutput(this, "CFTopURL", {
      value: `https://${cloudfrontDist.domainName}/`,
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("./public")],
      destinationBucket: siteBucket,
      distribution: cloudfrontDist,
      distributionPaths: ["/*"],
      retainOnDelete: false,
    });
  }
}
