const https = require("https");
const { URL } = require("url");

const BASE_URL = "https://map.schweizmobil.ch/api/4/";
const LANG_CODE = "en";

// Available route types in the Switzerland Mobility API
const ROUTE_TYPES = {
  national: "WanderlandRoutenNational",
  regional: "WanderlandRoutenRegional",
  local: "WanderlandRoutenLokal",
  "snowshoe-local": "SnowshoeRoutenLokal",
};

// Generic HTTPS request function
function makeHttpsRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObject = new URL(url);

    const options = {
      hostname: urlObject.hostname,
      port: urlObject.port || 443,
      path: urlObject.pathname + urlObject.search,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// Build Switzerland Mobility API URL for fetching route data
function getRouteUrl(routeNr) {
  return `${BASE_URL}route_or_segment/hike/${routeNr}/0?lang=${LANG_CODE}`;
}

// Build Switzerland Mobility API URL for fetching route data
function getPointsUrl(routeType, routeNr) {
  const qs = `${ROUTE_TYPES[routeType]}=${routeNr}`;
  return `${BASE_URL}query/featuresmultilayers?${qs}`;
}

// Fetch route data from Switzerland Mobility API
function fetchSchweizmobilRoute(routeNr) {
  const url = getRouteUrl(routeNr);
  return makeHttpsRequest(url);
}

// Fetch route coordinates from Switzerland Mobility API
function fetchSchweizmobilPoints(routeType, routeNr) {
  const url = getPointsUrl(routeType, routeNr);
  return makeHttpsRequest(url).then((feature) => {
    if (!feature.features || feature.features.length === 0) {
      throw new Error(`No route found for ${routeType}-${routeNr}`);
    }
    const points = feature.features[0]?.geometry?.coordinates[0];
    if (!points || points.length === 0) {
      throw new Error(`No points found for ${routeType}-${routeNr}`);
    }
    return points;
  });
}

module.exports = {
  ROUTE_TYPES,
  fetchSchweizmobilRoute,
  fetchSchweizmobilPoints,
};
