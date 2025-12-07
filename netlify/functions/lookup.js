const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  const ip = event.queryStringParameters?.ip || "8.8.8.8";

  const apis = [
    `https://ipapi.co/${ip}/json/`,
    `https://ipwho.is/${ip}`,
    `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,lat,lon`
  ];

  let data = null;

  for (let url of apis) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      // Check if API returned valid data
      if (json.error || json.status === "fail") continue;
      if (json.country || json.success) {
        data = json;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!data) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Data not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
