import React, { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import { getEndpoint, getResults, createEndpoint } from "./api";
import { Layout } from "./layout";

const apiRoot = `${location.origin}/api`;

type Route = "not_found" | "top" | ["endpoints", string];
function parseRoute(path: string): Route {
  let params = null;
  if ((params = /^\/$/.exec(path))) {
    return "top";
  }
  if ((params = /^\/endpoints\/([\w-]+)$/.exec(path))) {
    return ["endpoints", params[1]];
  }
  return "not_found";
}

const ResultItem = (props: { result: any }) => {
  const { result } = props;
  const date = new Date(result.requestedAt);
  const formattedTimestamp = date.toTimeString();
  return (
    <tr key={result.requestedAt}>
      <td>{formattedTimestamp}</td>
      <td>{JSON.stringify(result.request.body) ?? "(empty)"}</td>
    </tr>
  );
};

const EndpointPage = (props: { endpointKey: string }) => {
  const { endpointKey } = props;
  const [endpoint, setEndpoint] = useState<"not_found" | any | null>(null);
  const [items, setItems] = useState<"not_found" | any[] | null>(null);
  useEffect(() => {
    (async () => {
      const endpoint = await getEndpoint(endpointKey);
      setEndpoint(endpoint == null ? "not_found" : endpoint);
      const results = await getResults(endpointKey);
      setItems(results == null ? "not_found" : results.items);
    })();
  }, []);
  const content =
    endpoint == null ? (
      <div>Loading...</div>
    ) : endpoint == "not_found" ? (
      <div>Endpoint "{endpointKey}" not found.</div>
    ) : (
      <React.Fragment>
        <p>To use this endpoint:</p>
        <pre>
          <code>
            {endpoint.method === "GET"
              ? `$ curl ${apiRoot}/${endpointKey}`
              : `$ curl -X ${endpoint.method} -d '{}' ${apiRoot}/${endpointKey}`}
          </code>
        </pre>
        <p>To see the results:</p>
        <pre>
          <code>{`$ curl ${apiRoot}/endpoints/${endpointKey}/results`}</code>
        </pre>
        <h3>Results</h3>
        {items == null ? (
          <div>Loading...</div>
        ) : items === "not_found" ? (
          <div>Endpoint "{endpointKey}" not found.</div>
        ) : items.length == 0 ? (
          <div>No items.</div>
        ) : (
          <table className="result-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <ResultItem result={item} />
              ))}
            </tbody>
          </table>
        )}
      </React.Fragment>
    );
  return (
    <Layout>
      <h2>{endpointKey}</h2>
      {content}
    </Layout>
  );
};

const TopPage = () => {
  const handleClick = async () => {
    const endpoint = await createEndpoint("GET", {
      body: "Hello!",
    });
    history.pushState(null, "", `/endpoints/${endpoint.key}`);
    globalEvents.dispatchEvent(new Event("pushstate"));
  };
  return (
    <Layout>
      <p>Define REST API and track the requests.</p>
      <h2>Example</h2>
      <p>Here is how to create an endpoint, call it and see the result.</p>
      <pre>
        <code>{`$ curl -s -X POST -d '{ "method":"GET", "response":{"body":"Hello!"} }' ${apiRoot}/endpoints`}</code>
        <br />
        <code className="light">{`{"key":"ca5aea78-9c5d-4032-8829-ad7e90ad91e9"}`}</code>
        <br />
        <code>{`$ curl ${apiRoot}/ca5aea78-9c5d-4032-8829-ad7e90ad91e9`}</code>
        <br />
        <code className="light">{`Hello!`}</code>
        <br />
        <code>{`$ curl ${apiRoot}/endpoints/ca5aea78-9c5d-4032-8829-ad7e90ad91e9/results`}</code>
        <br />
        <code className="light">{`{"items":[{"request":{"method":"GET","headers":{"host":"${location.host}","connection":"close","user-agent":"curl/7.54.0","accept":"*/*","x-request-id":"26b654c2-18be-4c53-8018-d9d707a8e5dc","x-forwarded-for":"153.156.78.134","x-forwarded-proto":"http","x-forwarded-port":"80","via":"1.1 vegur","connect-time":"0","x-request-start":"1565949486167","total-route-time":"0"},"body":{}},"requestedAt":1565949486167}]}`}</code>
      </pre>
      <h2>Try Now</h2>
      <p>
        Make a simple endpoint which accepts GET request and returns "Hello!".
      </p>
      <div>
        <button onClick={handleClick}>Create New Endpoint</button>
      </div>
    </Layout>
  );
};

const globalEvents = new EventTarget();

const Main = () => {
  const [route, setRoute] = useState<Route | null>(null);
  useEffect(() => {
    const handle = () => {
      const newRoute = parseRoute(location.pathname);
      setRoute(newRoute);
    };
    window.addEventListener("popstate", handle);
    globalEvents.addEventListener("pushstate", handle);
    handle();
    return () => {
      window.removeEventListener("popstate", handle);
      globalEvents.removeEventListener("pushstate", handle);
    };
  }, []);
  let content = null;
  if (route == null) {
  } else if (route == "not_found") {
    content = <div>Not Found</div>;
  } else if (route === "top") {
    content = <TopPage />;
  } else if (route[0] === "endpoints") {
    content = <EndpointPage endpointKey={route[1]} />;
  }
  return content;
};

ReactDOM.render(<Main />, document.getElementById("root"));
