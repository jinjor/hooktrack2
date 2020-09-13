#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { Hooktrack2Stack } from "../lib/hooktrack2-stack";

const app = new cdk.App();
new Hooktrack2Stack(app, "Hooktrack2Stack", {
  // env: {
  //   account: process.env.CDK_DEFAULT_ACCOUNT,
  //   region: process.env.CDK_DEFAULT_REGION,
  // },
});
