import * as zlib from "zlib";
import fetch from "node-fetch";
import * as assert from "assert";
import "mocha";

const apiRoot = process.env.API_ROOT;

async function send(
  method: string,
  path: string,
  data: any,
  gzip?: boolean
): Promise<any> {
  console.log(method, path);
  const url = apiRoot + path;
  const options: any = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
  if (data) {
    if (gzip) {
      const bin = zlib.gzipSync(JSON.stringify(data));
      options.headers["content-encoding"] = "gzip";
      options.body = bin;
    } else {
      options.body = JSON.stringify(data);
    }
  }
  return fetch(url, options);
}
async function get(path: string): Promise<any> {
  return send("GET", path, null);
}
async function post(path: string, data: any, gzip?: boolean): Promise<any> {
  return send("POST", path, data, gzip);
}

describe("Hooktrack2", function () {
  this.timeout(30 * 1000);
  it("run", async () => {
    let res;
    res = await post(`/endpoints`, {
      method: "POST",
      response: {
        status: 200,
        headers: {
          foo: "bar",
        },
        body: JSON.stringify({
          greeting: "Hello!",
        }),
      },
    });
    const json = await res.json();
    console.log(json);
    assert.equal(res.status, 200);
    const key = json.key;
    res = await post(`/${key}`, { num: 1 });
    res = await post(`/${key}`, { num: 2 }, false); // TODO
    assert.equal(res.status, 200);
    const data = await res.json();
    console.log("data", data);
    assert.equal(res.headers.get("foo"), "bar");
    assert.equal(data.greeting, "Hello!");

    // for eventual consistency...
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res = await get(`/endpoints/${key}/results`);
    let results = await res.json();
    console.log("results", results);
    assert.equal(results.items.length, 2);
    assert.deepEqual(results.items[0].request.body, { num: 2 });
    assert.deepEqual(results.items[1].request.body, { num: 1 });
    res = await get(`/endpoints/${key}/results?from=${Date.now()}`);
    results = await res.json();
    console.log("results", results);
    assert.equal(results.items.length, 0);
    res = await get(`/endpoints/${key}/results?from=${Date.now() - 10 * 1000}`);
    results = await res.json();
    console.log("results", results);
    assert.equal(results.items.length, 2);
  });
  it("errors", async () => {
    let res;
    res = await get(`/foo`);
    assert.equal(res.status, 404, JSON.stringify(await res.json()));
    res = await post(`/foo`, {});
    assert.equal(res.status, 404, JSON.stringify(await res.json()));
    // TODO
    // res = await get(`/endpoints/foo`);
    // assert.equal(res.status, 404, JSON.stringify(await res.json()));
    res = await get(`/endpoints/foo/results`);
    assert.equal(res.status, 404, JSON.stringify(await res.json()));
    res = await get(`/endpoints/xxx/results?from=xxx`);
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, null);
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {});
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    for (const method of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTION",
    ]) {
      res = await post(`/endpoints`, {
        method,
      });
      assert.equal(res.status, 200, JSON.stringify(await res.json()));
    }
    res = await post(`/endpoints`, {
      method: "",
    });
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: 200,
        body: "",
      },
    });
    assert.equal(res.status, 200, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        body: "{}",
      },
    });
    assert.equal(res.status, 200, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: 200,
      },
    });
    assert.equal(res.status, 200, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        body: {},
      },
    });
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        status: "",
      },
    });
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
    res = await post(`/endpoints`, {
      method: "GET",
      response: {
        headers: [],
      },
    });
    assert.equal(res.status, 400, JSON.stringify(await res.json()));
  });
});
