console.log("hello from JS");

(async () => {
  const res = await fetch("/api/endpoints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ method: "GET", response: { body: "Hello!" } }),
  });
  const json = await res.json();
  console.log(json);

  const res1 = await fetch(`/api/${json.key}`);
  const text1 = await res1.text();
  console.log(text1);

  const res2 = await fetch(`/api/endpoints/${json.key}/results`);
  const json2 = await res2.json();
  console.log(json2);
})();
