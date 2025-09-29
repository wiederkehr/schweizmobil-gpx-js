#!/usr/bin/env node

// CLI tool to download hiking routes from schweizmobil.ch and convert them to GPX format.

const fs = require("fs");
const path = require("path");
const {
  ROUTE_TYPES,
  fetchSchweizmobilRoute,
  fetchSchweizmobilPoints,
} = require("./lib/api");
const { convertLv03ToWgs84 } = require("./lib/coordinates");
const { createSlug } = require("./lib/strings");
const { createGpxFromPoints } = require("./lib/gpx");

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

  if (process.argv.length < 3 || process.argv.length > 4) {
    console.error(`usage: <${types}> <route_nr>`);
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
    const { title } = await fetchSchweizmobilRoute(routeNr);
    const routeName = title || `${routeType}-${routeNr}`;
    const routeSlug = createSlug(routeName);

    const outputDir = "output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${routeSlug}.gpx`;
    const filePath = path.join(outputDir, fileName);

    const lv03Points = await fetchSchweizmobilPoints(routeType, routeNr);
    const wgs84Points = lv03Points.map(([y, x]) => convertLv03ToWgs84(y, x));
    const gpx = createGpxFromPoints(wgs84Points, routeName);

    fs.writeFileSync(filePath, gpx);
    console.log(`Route "${routeName}" saved to ${filePath}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
