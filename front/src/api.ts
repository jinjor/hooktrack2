export async function createEndpoint(
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
export async function getEndpoint(key: string): Promise<any | null> {
  const res = await fetch(`/api/endpoints/${key}`);
  if (res.status === 404) {
    return null;
  }
  return await res.json();
}
export async function callAPI(
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

export async function getResults(
  key: string
): Promise<{ items: any[] } | null> {
  const res = await fetch(`/api/endpoints/${key}/results`, {
    cache: "no-cache",
  });
  if (res.status === 404) {
    return null;
  }
  return await res.json();
}
