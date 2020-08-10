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

const Main = () => {
  const [key, setKey]: [string | null, any] = useState(null);
  const [items, setItems]: [any[] | null, any] = useState(null);
  useEffect(() => {
    if (key != null) {
      return;
    }
    console.log("create endpoint");
    (async () => {
      const endpoint = await createEndpoint("GET", { body: "Hello!" });
      setKey(endpoint.key);
    })();
  }, [key]);
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
  // console.log(items);
  return (
    <ul>
      {(items ?? []).map((item: any) => (
        <li>{item.requestedAt}</li>
      ))}
    </ul>
  );
};

ReactDOM.render(<Main />, document.getElementById("root"));
