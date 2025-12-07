// Ensure node-fetch is installed: npm install node-fetch@2
const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  // Get IP from query string, default to 8.8.8.8
  const ip = event.queryStringParameters?.ip || "8.8.8.8";

  // Multiple API fallback
  const apis = [
    `https://ipapi.co/${ip}/json/`,
    `https://ipwho.is/${ip}`,
    `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,lat,lon`
  ];

  let data = null;

  // Loop through APIs until valid data is found
  for (let url of apis) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();

      // Check for valid data
      if (json.error || json.status === "fail") continue;
      if (json.country || json.success) {
        data = json;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // If no data found
  if (!data) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Data not found" }),
    };
  }

  // Return the JSON result
  return {
    statusCode: 200,
    body: JSON.stringify({
      ip: ip,
      country: data.country_name || data.country || "",
      country_code: data.country_code || data.countryCode || "",
      state: data.region || data.regionName || "",
      city: data.city || "",
      zip: data.postal || data.zip || "",
      latitude: data.latitude || (data.loc ? data.loc.split(",")[0] : ""),
      longitude: data.longitude || (data.loc ? data.loc.split(",")[1] : "")
    }),
  };
};
