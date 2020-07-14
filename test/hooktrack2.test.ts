import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Hooktrack2 from "../lib/hooktrack2-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Hooktrack2.Hooktrack2Stack(app, "MyTestStack");
  // THEN
  // expectCDK(stack).to(matchTemplate({
  //   "Resources": {}
  // }, MatchStyle.EXACT))
});
