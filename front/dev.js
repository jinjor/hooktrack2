const Bundler = require("parcel-bundler");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// export PROXY_TARGET=https://xxxxxxxx.cloudfront.net
const target = process.env.PROXY_TARGET;
if (!target) {
  console.log("PROXY_TARGET is required.");
  process.exit(1);
}

app.use(
  createProxyMiddleware("/api", {
    target,
    changeOrigin: true,
  })
);

const bundler = new Bundler("src/index.html");
app.use(bundler.middleware());

app.listen(Number(process.env.PORT || 1234));
