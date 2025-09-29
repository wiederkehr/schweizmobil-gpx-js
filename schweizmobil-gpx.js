#!/usr/bin/env node

// CLI tool to download hiking routes from schweizmobil.ch and convert them to GPX format.

const fs = require("fs");
const https = require("https");
const { URL } = require("url");

// Available route types in the Switzerland Mobility API
const ROUTE_TYPES = {
	national: "WanderlandRoutenNational",
	regional: "WanderlandRoutenRegional",
	local: "WanderlandRoutenLokal",
	"snowshoe-local": "SnowshoeRoutenLokal",
};

// Convert Swiss LV03 coordinates to WGS84 (lat/lng)
function convertLv03ToWgs84(y, x) {
	const yAux = (y - 600000) / 1000000;
	const xAux = (x - 200000) / 1000000;

	const lng =
		((2.6779094 +
			4.728982 * yAux +
			0.791484 * yAux * xAux +
			0.1306 * yAux * Math.pow(xAux, 2) -
			0.0436 * Math.pow(yAux, 3)) *
			100) /
		36;

	const lat =
		((16.9023892 +
			3.238272 * xAux -
			0.270978 * Math.pow(yAux, 2) -
			0.002528 * Math.pow(xAux, 2) -
			0.0447 * Math.pow(yAux, 2) * xAux -
			0.014 * Math.pow(xAux, 3)) *
			100) /
		36;

	return [lat, lng];
}

// Build Switzerland Mobility API URL for fetching route data
function createSchweizmobilUrl(routeType, routeNr) {
	const qs = `${ROUTE_TYPES[routeType]}=${routeNr}`;
	return `https://map.schweizmobil.ch/api/4/query/featuresmultilayers?${qs}`;
}

// Fetch route coordinates from Switzerland Mobility API
function fetchSchweizmobilPoints(routeType, routeNr) {
	return new Promise((resolve, reject) => {
		const url = createSchweizmobilUrl(routeType, routeNr);
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
					const feature = JSON.parse(data);
					if (!feature.features || feature.features.length === 0) {
						throw new Error(`No route found for ${routeType}-${routeNr}`);
					}
					const points = feature.features[0]?.geometry?.coordinates[0];
					if (!points || points.length === 0) {
						throw new Error(`No points found for ${routeType}-${routeNr}`);
					}
					resolve(points);
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

// Generate GPX XML from coordinate points
function createGpxFromPoints(wgs84Points, routeName) {
	const trackPoints = wgs84Points
		.map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="https://www.topografix.com/GPX/1/1" creator="schweizmobil-gpx-js">
  <metadata>
    <name>${routeName}</name>
    <creator>schweizmobil-gpx</creator>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>
    ${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Main CLI logic
 *
 * Command line arguments:
 * @param {string} process.argv[2] - Route type (national|regional|local|snowshoe-local)
 * @param {string} process.argv[3] - Route number (must be numeric)
 * @param {string} [process.argv[4]] - Optional output filename (defaults to <routeType>-<routeNr>.gpx)
 *
 * @throws {Error} Exits with code 1 on invalid arguments or API errors
 * @returns {Promise<void>} Resolves when GPX file is successfully created
 */
async function main() {
	const types = Object.keys(ROUTE_TYPES).join("|");
	const routeType = process.argv[2];
	const routeNr = process.argv[3];
	const routeName = `${routeType}-${routeNr}`;
	const fileName = process.argv[4] || `${routeName}.gpx`;

	if (process.argv.length < 4 || process.argv.length > 5) {
		console.error(`usage: <${types}> <route_nr> [out.gpx]`);
		process.exit(1);
	}

	if (!(routeType in ROUTE_TYPES)) {
		console.error(`error: ${routeType} is not <${types}>`);
		process.exit(1);
	}

	if (!/^\d+$/.test(routeNr)) {
		console.error(`error: invalid route number: ${routeNr}`);
		process.exit(1);
	}

	try {
		const lv03Points = await fetchSchweizmobilPoints(routeType, routeNr);
		const wgs84Points = lv03Points.map(([y, x]) => convertLv03ToWgs84(y, x));
		const gpx = createGpxFromPoints(wgs84Points, routeName);

		fs.writeFileSync(fileName, gpx);
		console.log(`Route "${routeName}" saved to ${fileName}`);
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
