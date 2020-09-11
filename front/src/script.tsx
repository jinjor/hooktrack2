import React, { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";

async function createEndpoint(
  method: string,
  response: { body: string }
): Promise<{ key: string }> {
  const res = await fetch("/api/endpoints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method, response }),
  });
  return await res.json();
}
async function callAPI(
  key: string,
  method: string,
  body?: string
): Promise<string> {
  const res = await fetch(`/api/${key}`, {
    method,
    body,
  });
  return await res.text();
}

async function getResults(key: string): Promise<{ items: any[] }> {
  const res = await fetch(`/api/endpoints/${key}/results`);
  return await res.json();
}

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

const EndpointPage = (props: { endpointKey: string }) => {
  const { endpointKey } = props;
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const results = await getResults(endpointKey);
      setItems(results.items);
    })();
  }, [endpointKey]);
  // useEffect(() => {
  //   if (key == null) {
  //     return;
  //   }
  //   const intervalId = setInterval(async () => {
  //     const text = await callAPI(key, "GET");
  //     console.log(text);
  //   }, 5000);
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [key]);
  // useEffect(() => {
  //   if (key == null) {
  //     return;
  //   }
  //   const intervalId = setInterval(async () => {
  //     const results = await getResults(key);
  //     setItems(results.items);
  //   }, 3000);
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [key]);
  const result =
    items == null ? (
      <div>Loading...</div>
    ) : items.length == 0 ? (
      <div>No items.</div>
    ) : (
      <ul>
        {items.map((item: any) => (
          <li>{item.requestedAt}</li>
        ))}
      </ul>
    );
  return (
    <div>
      <h1>{endpointKey}</h1>
      {result}
    </div>
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
  const apiRoot = `${location.origin}/api`;
  return (
    <div>
      <h1>Hooktrack</h1>
      <p>Define REST API and track the requests.</p>
      <pre>
        <code>{`$ curl -s -X POST -H "Content-Type: application/json" -d '{ "method":"GET", "response":{"body":"Hello!"} }' ${apiRoot}/endpoints`}</code>
        <br />
        <code>{`{"key":"ca5aea78-9c5d-4032-8829-ad7e90ad91e9"}`}</code>
        <br />
        <code>{`$ curl ${apiRoot}/ca5aea78-9c5d-4032-8829-ad7e90ad91e9`}</code>
        <br />
        <code>{`Hello!`}</code>
        <br />
        <code>{`$ curl ${apiRoot}/endpoints/ca5aea78-9c5d-4032-8829-ad7e90ad91e9/results`}</code>
        <br />
        <code>{`{"items":[{"request":{"method":"GET","headers":{"host":"${location.host}","connection":"close","user-agent":"curl/7.54.0","accept":"*/*","x-request-id":"26b654c2-18be-4c53-8018-d9d707a8e5dc","x-forwarded-for":"153.156.78.134","x-forwarded-proto":"http","x-forwarded-port":"80","via":"1.1 vegur","connect-time":"0","x-request-start":"1565949486167","total-route-time":"0"},"body":{}},"requestedAt":1565949486167}]}`}</code>
      </pre>
      <p>
        <a href="https://github.app/jinjor/hooktrack2">Source(GitHub)</a>
      </p>
      <p>
        <button onClick={handleClick}>Create New Endpoint</button>
      </p>
    </div>
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
