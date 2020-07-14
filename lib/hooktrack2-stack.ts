import * as cdk from "@aws-cdk/core";
import * as hooktrack2 from "./hooktrack2";

export class Hooktrack2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new hooktrack2.Hooktrack2Service(this, "Hooktrack2");
  }
}
